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
      branchId
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

    // If user, show only reports from their creator's branch
    if (req.user.role === 'user') {
      const creator = await db.User.findByPk(req.user.createdBy);
      if (creator) {
        whereClause.branchId = creator.branchId;
      }
    }
    // If agent, only show their branch
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
      include: [{
        model: db.Branch,
        as: 'branch',
        attributes: ['name']
      }]
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ message: 'Error fetching daily reports' });
  }
});

module.exports = router;
