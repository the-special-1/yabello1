const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get user balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.credits });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Error fetching user balance' });
  }
});

module.exports = router;
