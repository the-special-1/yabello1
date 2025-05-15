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
    const { fromDate } = req.body;
    
    // Parse date and handle timezone
    const date = new Date(fromDate);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    let whereClause = {
      date: {
        [Op.between]: [date, new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)]
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
    else if (req.body.branchId) {
      whereClause.branchId = req.body.branchId;
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
    console.log('Sales report request body:', req.body);
    
    // Extract date parameters with fallbacks
    let { fromDate, toDate, reportType, branchId, userId } = req.body;
    
    // Use current date as fallback if dates are missing
    if (!fromDate && !toDate) {
      console.log('Using default date range (today)');
      const today = new Date();
      fromDate = today.toISOString().split('T')[0];
      toDate = today.toISOString().split('T')[0];
    } else if (!fromDate) {
      console.log('Using toDate as fromDate since fromDate is missing');
      fromDate = toDate;
    } else if (!toDate) {
      console.log('Using fromDate as toDate since toDate is missing');
      toDate = fromDate;
    }
    
    console.log('Using date range:', { fromDate, toDate });
    
    // Handle various date formats
    let startDate, endDate;
    try {
      // Try to parse dates in different formats
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      
      // If dates are invalid, try alternative parsing
      if (isNaN(startDate.getTime())) {
        console.log('Trying alternative date parsing for fromDate');
        const parts = fromDate.split(/[-\/]/);
        if (parts.length === 3) {
          // Try different date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD)
          startDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])); // MM/DD/YYYY
          if (isNaN(startDate.getTime())) {
            startDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])); // DD/MM/YYYY
          }
          if (isNaN(startDate.getTime())) {
            startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])); // YYYY/MM/DD
          }
        }
      }
      
      if (isNaN(endDate.getTime())) {
        console.log('Trying alternative date parsing for toDate');
        const parts = toDate.split(/[-\/]/);
        if (parts.length === 3) {
          endDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])); // MM/DD/YYYY
          if (isNaN(endDate.getTime())) {
            endDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])); // DD/MM/YYYY
          }
          if (isNaN(endDate.getTime())) {
            endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])); // YYYY/MM/DD
          }
        }
      }
      
      // Final validation
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Could not parse dates after multiple attempts');
      }
      
      // Ensure endDate is at the end of the day
      endDate.setHours(23, 59, 59, 999);
      
      console.log('Successfully parsed dates:', { startDate, endDate });
    } catch (error) {
      console.error('Date parsing error:', error);
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format.' });
    }

    let whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Handle branch permissions
    if (req.user.role === 'agent') {
      whereClause.branchId = req.user.branchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    if (req.user.role === 'user') {
      whereClause.userId = req.user.id;
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
    // Provide more detailed error information
    const errorMessage = error.message || 'Error generating sales report';
    console.error('Detailed error:', {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: errorMessage, details: error.name });
  }
});

module.exports = router;
