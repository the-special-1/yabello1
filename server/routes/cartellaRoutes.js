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

// Update cartella
router.put('/:id', auth, async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { numbers, branchId } = req.body;

    if (!numbers || !branchId) {
      throw new Error('Missing required fields');
    }

    const user = await db.User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the cartella with the specific ID and branch ID
    const cartella = await db.Cartella.findOne({
      where: {
        id: id,
        branchId: branchId
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!cartella) {
      await t.rollback();
      return res.status(404).json({ error: 'Cartella not found' });
    }

    // Only allow superadmin or the creator to update
    if (user.role !== 'superadmin' && cartella.createdBy !== user.id) {
      await t.rollback();
      return res.status(403).json({ error: 'Unauthorized to update this cartella' });
    }

    // Update cartella numbers
    const updatedCartella = await cartella.update({ 
      numbers: numbers,
      updatedAt: new Date()
    }, { 
      transaction: t,
      returning: true,
      plain: true
    });

    // Fetch the updated cartella with associations before committing
    const result = await db.Cartella.findByPk(updatedCartella.id, {
      include: [{
        model: db.Branch,
        as: 'branch',  // Using the correct alias from the association
        attributes: ['name']
      }],
      transaction: t
    });

    // Commit the transaction
    await t.commit();
    
    // Send the response after successful commit
    res.json({ 
      message: 'Cartella updated successfully', 
      cartella: result.get({ plain: true })
    });
  } catch (error) {
    // Only rollback if transaction is still active
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Update cartella error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update cartella',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete cartella
router.delete('/:id', auth, async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const user = await db.User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      throw new Error('User not found');
    }

    // Find the cartella
    const cartella = await db.Cartella.findOne({
      where: {
        id,
        branchId: user.branchId
      },
      transaction: t
    });

    if (!cartella) {
      throw new Error('Cartella not found');
    }

    // Only allow superadmin or the creator to delete
    if (user.role !== 'superadmin' && cartella.createdBy !== user.id) {
      throw new Error('Unauthorized to delete this cartella');
    }

    // Delete the cartella
    await cartella.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Cartella deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete cartella error:', error);
    res.status(400).json({ error: error.message });
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
