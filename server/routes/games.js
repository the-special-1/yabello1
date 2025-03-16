const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth, authorize } = require('../middleware/auth');
const { sequelize } = require('../models');

// Create a new game
router.post('/create', auth, authorize(['user']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { stake } = req.body;
    const player = req.user;

    if (player.credits < stake) {
      throw new Error('Insufficient credits');
    }

    const agent = await User.findByPk(player.createdBy);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const game = await Game.create({
      stake,
      agentCommission: agent.commission,
      totalPrizePool: stake,
      status: 'waiting'
    }, { transaction: t });

    // Deduct stake from player
    await player.decrement('credits', { by: stake, transaction: t });

    // Create transaction record
    await Transaction.create({
      senderId: player.id,
      receiverId: null,
      amount: stake,
      type: 'game_stake',
      status: 'completed'
    }, { transaction: t });

    await t.commit();
    res.status(201).json(game);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Join a game
router.post('/:gameId/join', auth, authorize(['user']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const game = await Game.findByPk(req.params.gameId);
    if (!game || game.status !== 'waiting') {
      throw new Error('Game not available');
    }

    const player = req.user;
    if (player.credits < game.stake) {
      throw new Error('Insufficient credits');
    }

    // Update game total prize pool and players
    await game.increment('totalPlayers', { transaction: t });
    await game.increment('totalPrizePool', { by: game.stake, transaction: t });

    // Deduct stake from player
    await player.decrement('credits', { by: game.stake, transaction: t });

    // Create transaction record
    await Transaction.create({
      senderId: player.id,
      receiverId: null,
      amount: game.stake,
      type: 'game_stake',
      status: 'completed'
    }, { transaction: t });

    // Check if game should start
    if (game.totalPlayers + 1 >= game.maxPlayers) {
      await game.update({ status: 'in_progress' }, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Successfully joined the game' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// End game and distribute winnings
router.post('/:gameId/end', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { winnerId } = req.body;
    const game = await Game.findByPk(req.params.gameId);
    
    if (!game || game.status !== 'in_progress') {
      throw new Error('Invalid game state');
    }

    const winner = await User.findByPk(winnerId);
    if (!winner) {
      throw new Error('Winner not found');
    }

    const agent = await User.findByPk(winner.createdBy);
    const agentCommissionAmount = (game.totalPrizePool * game.agentCommission) / 100;
    const winnerAmount = game.totalPrizePool - agentCommissionAmount;

    // Update game status
    await game.update({
      status: 'completed',
      winnerId
    }, { transaction: t });

    // Transfer winnings to winner
    await winner.increment('credits', { by: winnerAmount, transaction: t });
    await Transaction.create({
      senderId: null,
      receiverId: winner.id,
      amount: winnerAmount,
      type: 'game_winning',
      status: 'completed'
    }, { transaction: t });

    // Transfer commission to agent
    if (agentCommissionAmount > 0) {
      await agent.increment('credits', { by: agentCommissionAmount, transaction: t });
      await Transaction.create({
        senderId: null,
        receiverId: agent.id,
        amount: agentCommissionAmount,
        type: 'game_winning',
        status: 'completed'
      }, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Game completed successfully' });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Get active games
router.get('/active', auth, async (req, res) => {
  try {
    const games = await Game.findAll({
      where: {
        status: ['waiting', 'in_progress']
      }
    });
    res.json(games);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
