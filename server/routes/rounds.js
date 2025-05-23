const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');

// Helper function to check if it's a new day
const shouldReset = (lastDate) => {
    const now = new Date();
    const last = new Date(lastDate);
    return now.toDateString() !== last.toDateString();
};

// Get current round for a user in a specific branch
router.get('/current/:branchId', auth, async (req, res) => {
    try {
        const { branchId } = req.params;
        const userId = req.user.id;
        const now = new Date();

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: 1,
                date: now
            });
        } else if (shouldReset(round.date)) {
            // Reset round if 24 hours have passed
            round.currentRound = 1;
            round.date = now;
            await round.save();
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
        const now = new Date();

        let round = await db.Round.findOne({
            where: { userId, branchId }
        });

        if (!round) {
            // For new entries, start at round 1 and then increment
            round = await db.Round.create({
                userId,
                branchId,
                currentRound: 1,
                date: now
            });
            round.currentRound = 2; // Increment to 2
        } else if (shouldReset(round.date)) {
            // Reset to 1 if 24 hours have passed
            round.currentRound = 1;
            round.date = now;
            await round.save();
        } else {
            round.currentRound += 1;
            round.date = now;
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
                currentRound: roundNumber,
                date: new Date()
            });
        } else {
            round.currentRound = roundNumber;
            round.date = new Date();
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
                currentRound: 1,
                date: new Date()
            });
        } else {
            round.currentRound = 1;
            round.date = new Date();
            await round.save();
        }

        res.json({ currentRound: round.currentRound });
    } catch (error) {
        console.error('Error resetting round:', error);
        res.status(500).json({ error: 'Failed to reset round' });
    }
});

module.exports = router;
