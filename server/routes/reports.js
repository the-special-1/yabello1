const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const { startOfDay, endOfDay } = require('date-fns');

// Save round data
router.post('/save-round', auth, async (req, res) => {
  try {
    const { round, price, noPlayer, winnerPrice, income, date, branchId } = req.body;

    // Agents can only save reports for their own branch
    if (req.user.role === 'agent' && req.user.branchId !== branchId) {
      return res.status(403).json({ message: 'Not authorized to save reports for this branch' });
    }

    const report = await db.Report.create({
      round,
      price,
      noPlayer,
      winnerPrice,
      income,
      date,
      branchId,
      userId: req.user.id // Add the user ID who created the report
    });

    res.json(report);
  } catch (error) {
    console.error('Error saving round:', error);
    res.status(500).json({ message: 'Error saving round data' });
  }
});

// Get daily reports
router.post('/daily', auth, async (req, res) => {
  try {
    const { date, branchId } = req.body;
    const searchDate = new Date(date);

    let whereClause = {
      date: {
        [Op.between]: [
          startOfDay(searchDate),
          endOfDay(searchDate)
        ]
      }
    };

    // Regular users see only their own reports
    if (req.user.role === 'user') {
      whereClause.userId = req.user.id;
    }
    // Agents see reports from their branch, but separated by user
    else if (req.user.role === 'agent') {
      whereClause.branchId = req.user.branchId;
    } 
    // If superadmin and specific branch requested
    else if (branchId) {
      whereClause.branchId = branchId;
    }

    const reports = await db.Report.findAll({
      where: whereClause,
      order: [['round', 'ASC']],
      include: [
        {
          model: db.Branch,
          as: 'branch',
          attributes: ['name']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['username']
        }
      ]
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ message: 'Error fetching daily reports' });
  }
});

// Get sales report with date range support
router.post('/sales', auth, async (req, res) => {
  try {
    const { fromDate, toDate, reportType, branchId } = req.body;
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    let whereClause = {
      date: {
        [Op.between]: [startOfDay(startDate), endOfDay(endDate)]
      },
      userId: req.user.id // Only show current user's sales
    };

    // Handle branch permissions
    if (req.user.role === 'agent') {
      whereClause.branchId = req.user.branchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    const reports = await db.Report.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['username', 'cut']
        },
        {
          model: db.Branch,
          as: 'branch',
          attributes: ['name']
        }
      ],
      order: [['date', 'ASC']]
    });

    // Process and aggregate the data based on reportType
    const aggregatedData = reports.reduce((acc, report) => {
      const key = report.user.username;
      const reportIncome = parseFloat(report.income) || 0;
      const winnerPrice = parseFloat(report.winnerPrice) || 0;
      const totalIncome = reportIncome + winnerPrice;
      
      if (!acc[key]) {
        acc[key] = {
          name: report.user.username,
          city: 'yabello',
          address: report.branch.name,
          income: 0,
          percent: report.user.cut,
          totalCommission: 0
        };
      }
      
      acc[key].income += totalIncome;
      acc[key].totalCommission = (acc[key].income * acc[key].percent) / 100;
      
      return acc;
    }, {});

    const result = Object.values(aggregatedData);
    res.json(result);

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Error generating sales report' });
  }
});

module.exports = router;
