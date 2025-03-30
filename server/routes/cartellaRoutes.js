const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get all cartellas for the user's branch
router.get('/available', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all cartellas from the branch
    const cartellas = await db.Cartella.findAll({
      where: {
        branchId: user.branchId
      },
      order: [['id', 'ASC']],
      raw: true // Return plain objects instead of Sequelize instances
    });

    console.log('Found cartellas:', {
      count: cartellas.length,
      cartellaIds: cartellas.map(c => c.id)
    });

    res.json({ cartellas }); // Return as an object with cartellas array
  } catch (error) {
    console.error('Error fetching cartellas:', error);
    res.status(500).json({ message: 'Error fetching cartellas' });
  }
});

// Place bet on cartellas
router.post('/place-bet', auth, async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { selectedCartellas, betAmount, pattern } = req.body;

    if (!selectedCartellas || !selectedCartellas.length || !betAmount || !pattern) {
      throw new Error('Selected cartellas, bet amount, and pattern are required');
    }

    const user = await db.User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      throw new Error('User not found');
    }

    // Find or create system account for game transactions
    const [systemAccount] = await db.User.findOrCreate({
      where: { username: 'system' },
      defaults: {
        password: 'not_accessible',
        role: 'system',
        branchId: user.branchId,
        credits: 0,
        commission: 0,
        status: 'active',
        createdBy: user.id
      },
      transaction: t
    });

    // Calculate total bet amount
    const totalBetAmount = selectedCartellas.length * betAmount;

    // Check if user has enough credits
    if (user.credits < totalBetAmount) {
      throw new Error('Minimum balance reached. Please recharge your credit!');
    }

    // Deduct credits from user
    const newCredits = parseFloat((user.credits - totalBetAmount).toFixed(2));
    await user.update({ credits: newCredits }, { transaction: t });

    // Create game transaction
    await db.Transaction.create({
      senderId: user.id,
      receiverId: systemAccount.id,
      amount: totalBetAmount,
      type: 'game_stake',
      status: 'completed',
      description: `Bet placed on ${selectedCartellas.length} cartellas with pattern ${pattern}`
    }, { transaction: t });

    await t.commit();

    // Return updated user balance
    res.json({
      message: 'Bet placed successfully',
      credits: newCredits
    });
  } catch (error) {
    await t.rollback();
    console.error('Place bet error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
