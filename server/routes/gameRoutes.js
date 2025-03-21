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
      branchId: user.branchId,
      createdBy: user.id
    }, { transaction: t });

    // Update cartellas
    const updateResult = await db.Cartella.update(
      {
        gameId: game.id
      },
      {
        where: {
          id: cartellaIds,
          branchId: user.branchId,
          gameId: null
        },
        transaction: t
      }
    );

    if (!updateResult[0]) {
      await t.rollback();
      return res.status(400).json({ message: 'No valid cartellas found to update' });
    }

    // Deduct credits from user
    await user.decrement('credits', { by: betAmount, transaction: t });

    await t.commit();
    res.json({ message: 'Game registered successfully', game });
  } catch (error) {
    await t.rollback();
    console.error('Error registering game:', error);
    res.status(500).json({ message: 'Error registering game' });
  }
});

module.exports = router;
