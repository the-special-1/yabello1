const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get available cartellas for the user's branch
router.get('/available', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cartellas = await db.Cartella.findAll({
      where: {
        branchId: user.branchId,
        status: 'available',
        gameId: null
      },
      order: [['id', 'ASC']]
    });

    res.json(cartellas);
  } catch (error) {
    console.error('Error fetching cartellas:', error);
    res.status(500).json({ message: 'Error fetching available cartellas' });
  }
});

module.exports = router;
