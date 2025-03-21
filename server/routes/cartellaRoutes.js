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

module.exports = router;
