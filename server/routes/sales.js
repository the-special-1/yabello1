const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get sales data with filters
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, branchId, userId, period } = req.query;
    
    let whereClause = {
      type: 'game_stake',
      status: 'completed'
    };

    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Branch filter
    if (branchId) {
      whereClause['$sender.branchId$'] = branchId;
    }

    // User filter
    if (userId) {
      whereClause.senderId = userId;
    }

    // Role-based filtering
    if (req.user.role === 'agent') {
      whereClause['$sender.branchId$'] = req.user.branchId;
    }

    const sales = await db.Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'branchId'],
          include: [
            {
              model: db.Branch,
              as: 'branch',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate aggregations based on period
    let aggregatedData = [];
    if (period) {
      const salesByPeriod = sales.reduce((acc, sale) => {
        let key;
        const date = new Date(sale.createdAt);
        
        switch (period) {
          case 'daily':
            key = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const week = Math.floor(date.getDate() / 7);
            key = `${date.getFullYear()}-W${week}`;
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            key = date.getFullYear().toString();
            break;
        }

        if (!acc[key]) {
          acc[key] = {
            period: key,
            totalAmount: 0,
            count: 0
          };
        }
        acc[key].totalAmount += parseFloat(sale.amount);
        acc[key].count += 1;
        return acc;
      }, {});

      aggregatedData = Object.values(salesByPeriod);
    }

    // Calculate summary statistics
    const summary = {
      totalSales: sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0),
      totalTransactions: sales.length,
      averageTransaction: sales.length > 0 
        ? sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0) / sales.length 
        : 0
    };

    // Group by branch
    const salesByBranch = sales.reduce((acc, sale) => {
      const branchName = sale.sender?.branch?.name || 'Unknown';
      if (!acc[branchName]) {
        acc[branchName] = {
          totalAmount: 0,
          count: 0
        };
      }
      acc[branchName].totalAmount += parseFloat(sale.amount);
      acc[branchName].count += 1;
      return acc;
    }, {});

    res.json({
      sales,
      aggregatedData,
      summary,
      salesByBranch
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
