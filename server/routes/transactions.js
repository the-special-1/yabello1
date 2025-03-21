const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get user's transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'role']
        },
        {
          model: db.User,
          as: 'receiver',
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all transactions (for superadmin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const transactions = await db.Transaction.findAll({
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'username', 'role']
        },
        {
          model: db.User,
          as: 'receiver',
          attributes: ['id', 'username', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
