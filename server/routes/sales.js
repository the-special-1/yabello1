'use strict';

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const db = require('../models');
const { Op } = require('sequelize');

// Get sales data with filters
router.get('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const { startDate, endDate, period, branchId, userId } = req.query;

    // Base where clause
    let whereClause = {
      type: { [Op.notIn]: ['game_stake', 'game_win'] }, // Exclude game transactions
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    // For agents, only show their branch's data
    if (req.user.role === 'agent') {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          {
            '$sender.branchId$': req.user.branchId,
            '$sender.createdBy$': req.user.id
          },
          {
            '$receiver.branchId$': req.user.branchId,
            '$receiver.createdBy$': req.user.id
          }
        ]
      };
    } else if (branchId) {
      // For superadmin with branch filter
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { '$sender.branchId$': branchId },
          { '$receiver.branchId$': branchId }
        ]
      };
    }

    if (userId) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    }

    // Get transactions
    const transactions = await db.Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'branchId', 'createdBy'],
          include: [{ model: db.Branch, as: 'branch', attributes: ['id', 'name'] }]
        },
        {
          model: db.User,
          as: 'receiver',
          attributes: ['id', 'username', 'branchId', 'createdBy'],
          include: [{ model: db.Branch, as: 'branch', attributes: ['id', 'name'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Process data based on period
    const aggregatedData = [];
    const salesByBranch = {};
    let totalSales = 0;
    let totalTransactions = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      totalSales += amount;
      totalTransactions++;

      // Aggregate by branch
      const branchName = transaction.sender?.branch?.name || 'Unknown';
      if (!salesByBranch[branchName]) {
        salesByBranch[branchName] = { totalAmount: 0, count: 0 };
      }
      salesByBranch[branchName].totalAmount += amount;
      salesByBranch[branchName].count++;

      // Aggregate by period
      const date = new Date(transaction.createdAt);
      let periodKey;
      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const week = Math.floor(date.getDate() / 7) + 1;
          periodKey = `Week ${week}, ${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'yearly':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      const existingPeriod = aggregatedData.find(d => d.period === periodKey);
      if (existingPeriod) {
        existingPeriod.totalAmount += amount;
        existingPeriod.count++;
      } else {
        aggregatedData.push({
          period: periodKey,
          totalAmount: amount,
          count: 1
        });
      }
    });

    res.json({
      summary: {
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
      },
      aggregatedData,
      salesByBranch
    });

  } catch (error) {
    console.error('Get sales data error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
