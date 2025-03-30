const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get current round for a user in a specific branch
router.get('/current/:branchId', auth, async (req, res) => {
    try {
        const { branchId } = req.params;
        const userId = req.user.id;

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: 1
            });
        }

        res.json({ currentRound: round.currentRound });
    } catch (error) {
        console.error('Error getting current round:', error);
        res.status(500).json({ error: 'Failed to get current round' });
    }
});

// Increment round number
router.post('/increment/:branchId', auth, async (req, res) => {
    try {
        const { branchId } = req.params;
        const userId = req.user.id;

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: 2 // Start at 2 since we're incrementing from 1
            });
        } else {
            round.currentRound += 1;
            await round.save();
        }

        res.json({ currentRound: round.currentRound });
    } catch (error) {
        console.error('Error incrementing round:', error);
        res.status(500).json({ error: 'Failed to increment round' });
    }
});

// Set specific round number
router.post('/set/:branchId', auth, async (req, res) => {
    try {
        const { branchId } = req.params;
        const { roundNumber } = req.body;
        const userId = req.user.id;

        if (!roundNumber || roundNumber < 1) {
            return res.status(400).json({ error: 'Invalid round number' });
        }

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: roundNumber
            });
        } else {
            round.currentRound = roundNumber;
            await round.save();
        }

        res.json({ currentRound: round.currentRound });
    } catch (error) {
        console.error('Error setting round:', error);
        res.status(500).json({ error: 'Failed to set round' });
    }
});

// Reset round to 1
router.post('/reset/:branchId', auth, async (req, res) => {
    try {
        const { branchId } = req.params;
        const userId = req.user.id;

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: 1
            });
        } else {
            round.currentRound = 1;
            await round.save();
        }

        res.json({ currentRound: round.currentRound });
    } catch (error) {
        console.error('Error resetting round:', error);
        res.status(500).json({ error: 'Failed to reset round' });
    }
});

module.exports = router;
