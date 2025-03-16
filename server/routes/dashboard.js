const express = require('express');
const router = express.Router();
const { User, Game, Cartella, Transaction, Branch } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {
      credits: 0,
      users: 0,
      games: 0,
      cartellas: 0,
      commission: 0,
      branch: null
    };

    // Get user with branch info
    const user = await User.findOne({
      where: { 
        id: req.user.id,
        status: 'active'  // Only active users can access dashboard
      },
      include: [{
        model: Branch,
        as: 'branch',
        attributes: ['id', 'name', 'location', 'status']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    if (user.branch && user.branch.status !== 'active') {
      return res.status(403).json({ error: 'Branch is inactive' });
    }

    stats.credits = parseFloat(user.credits) || 0;
    stats.commission = parseFloat(user.commission) || 0;
    stats.branch = user.branch;

    // Get counts based on user role
    if (user.role === 'superadmin') {
      // Superadmin sees all stats
      const [users, branches, cartellas, games, totalCredits] = await Promise.all([
        User.count({
          where: {
            role: {
              [Op.ne]: 'superadmin'
            },
            status: 'active'
          }
        }),
        Branch.count({
          where: { status: 'active' }
        }),
        Cartella.count(),
        Game.count(),
        User.sum('credits', {
          where: {
            role: {
              [Op.ne]: 'superadmin'
            },
            status: 'active'
          }
        })
      ]);

      stats.users = users;
      stats.branches = branches;
      stats.cartellas = cartellas;
      stats.games = games;
      stats.totalCredits = parseFloat(totalCredits) || 0;

    } else if (user.role === 'agent') {
      // Agent sees stats for their branch
      if (!user.branchId) {
        return res.status(400).json({ error: 'Agent not assigned to a branch' });
      }

      const [users, cartellas, games, totalCredits] = await Promise.all([
        User.count({
          where: {
            branchId: user.branchId,
            role: 'user',
            status: 'active'
          }
        }),
        Cartella.count({
          where: {
            branchId: user.branchId
          }
        }),
        Game.count({
          include: [{
            model: User,
            as: 'creator',
            where: {
              branchId: user.branchId,
              status: 'active'
            },
            required: true
          }]
        }),
        User.sum('credits', {
          where: {
            branchId: user.branchId,
            role: 'user',
            status: 'active'
          }
        })
      ]);

      stats.users = users;
      stats.cartellas = cartellas;
      stats.games = games;
      stats.totalCredits = parseFloat(totalCredits) || 0;

    } else {
      // Regular user sees only their game count and credits
      const [gameCount, cartellaCount] = await Promise.all([
        Game.count({
          where: {
            createdBy: user.id
          }
        }),
        Cartella.count({
          where: {
            createdBy: user.id
          }
        })
      ]);

      stats.games = gameCount;
      stats.cartellas = cartellaCount;
    }

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'username', 'role']
        }
      ]
    });

    res.json({
      ...stats,
      recentTransactions
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
