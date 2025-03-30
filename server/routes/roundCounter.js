const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const { startOfDay, endOfDay } = require('date-fns');

// Get current round for a branch
router.get('/current/:branchId', auth, async (req, res) => {
  try {
    const { branchId } = req.params;
    
    // Validate branchId
    if (!branchId || branchId === 'undefined') {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    const today = new Date();

    // Check if user has access to this branch
    if (req.user.role === 'agent' && req.user.branchId !== branchId) {
      return res.status(403).json({ message: 'Not authorized to access this branch' });
    }

    let counter = await db.RoundCounter.findOne({
      where: {
        branchId,
        date: today
      }
    });

    // If no counter exists for today, create one starting at round 1
    if (!counter) {
      counter = await db.RoundCounter.create({
        branchId,
        currentRound: 1,
        date: today
      });
    }

    res.json({ currentRound: counter.currentRound });
  } catch (error) {
    console.error('Error getting current round:', error);
    res.status(500).json({ message: 'Error getting current round' });
  }
});

// Increment round counter
router.post('/increment/:branchId', auth, async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate branchId
    if (!branchId || branchId === 'undefined') {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    const today = new Date();

    // Check if user has access to this branch
    if (req.user.role === 'agent' && req.user.branchId !== branchId) {
      return res.status(403).json({ message: 'Not authorized to access this branch' });
    }

    let [counter, created] = await db.RoundCounter.findOrCreate({
      where: {
        branchId,
        date: today
      },
      defaults: {
        currentRound: 1
      }
    });

    if (!created) {
      counter = await counter.update({
        currentRound: counter.currentRound + 1
      });
    }

    res.json({ currentRound: counter.currentRound });
  } catch (error) {
    console.error('Error incrementing round:', error);
    res.status(500).json({ message: 'Error incrementing round' });
  }
});

// Set specific round number
router.post('/set/:branchId', auth, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { roundNumber } = req.body;

    // Validate branchId
    if (!branchId || branchId === 'undefined') {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    const today = new Date();

    // Check if user has access to this branch
    if (req.user.role === 'agent' && req.user.branchId !== branchId) {
      return res.status(403).json({ message: 'Not authorized to access this branch' });
    }

    let [counter, created] = await db.RoundCounter.findOrCreate({
      where: {
        branchId,
        date: today
      },
      defaults: {
        currentRound: roundNumber
      }
    });

    if (!created) {
      counter = await counter.update({
        currentRound: roundNumber
      });
    }

    res.json({ currentRound: counter.currentRound });
  } catch (error) {
    console.error('Error setting round number:', error);
    res.status(500).json({ message: 'Error setting round number' });
  }
});

// Reset round counter to 1
router.post('/reset/:branchId', auth, async (req, res) => {
  try {
    const { branchId } = req.params;

    // Validate branchId
    if (!branchId || branchId === 'undefined') {
      return res.status(400).json({ message: 'Invalid branch ID' });
    }

    const today = new Date();

    // Check if user has access to this branch
    if (req.user.role === 'agent' && req.user.branchId !== branchId) {
      return res.status(403).json({ message: 'Not authorized to access this branch' });
    }

    let [counter, created] = await db.RoundCounter.findOrCreate({
      where: {
        branchId,
        date: today
      },
      defaults: {
        currentRound: 1
      }
    });

    if (!created) {
      counter = await counter.update({
        currentRound: 1
      });
    }

    res.json({ currentRound: counter.currentRound });
  } catch (error) {
    console.error('Error resetting round number:', error);
    res.status(500).json({ message: 'Error resetting round number' });
  }
});

module.exports = router;
