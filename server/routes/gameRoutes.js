const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');

// Register cartellas for a game
router.post('/register', auth, async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { cartellaIds, pattern, betAmount } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.credits < betAmount) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Create new game
    const game = await db.Game.create({
      pattern,
      status: 'pending',
      branchId: user.branchId,
      createdBy: user.id
    }, { transaction: t });

    // Update cartellas
    const updateResult = await db.Cartella.update(
      {
        gameId: game.id,
        status: 'playing'
      },
      {
        where: {
          id: cartellaIds,
          status: 'available',
          branchId: user.branchId
        },
        transaction: t
      }
    );

    if (!updateResult[0]) {
      await t.rollback();
      return res.status(400).json({ message: 'No valid cartellas found to update' });
    }

    // Get or create house account
    let houseAccount = await db.User.findOne({
      where: { username: 'house' },
      transaction: t
    });

    if (!houseAccount) {
      houseAccount = await db.User.create({
        username: 'house',
        password: 'not_accessible',
        role: 'system',
        status: 'active',
        branchId: user.branchId,
        credits: 0
      }, { transaction: t });
    }

    // Create transaction record
    await db.Transaction.create({
      userId: user.id,
      amount: betAmount,  
      type: 'game_stake',  
      status: 'completed',
      gameId: game.id,
      senderId: user.id,
      receiverId: houseAccount.id,
      description: `Game stake for game ${game.id}`
    }, { transaction: t });

    // Update user credits
    await user.update(
      { credits: user.credits - betAmount },
      { transaction: t }
    );

    await t.commit();
    res.json({ 
      message: 'Game registration successful',
      game: {
        id: game.id,
        pattern,
        status: game.status
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error registering game:', error);
    res.status(500).json({ message: error.message || 'Error registering game' });
  }
});

module.exports = router;
