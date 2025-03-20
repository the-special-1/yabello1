const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Register superadmin (initial setup)
router.post('/register-superadmin', async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const existingUser = await db.User.findOne({ 
      where: { role: 'superadmin' },
      transaction: t
    });
    
    if (existingUser) {
      throw new Error('Superadmin already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      username,
      password: hashedPassword,
      role: 'superadmin',
      status: 'active'
    }, { transaction: t });

    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '24h' }
    );

    await t.commit();
    res.status(201).json({ 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        credits: user.credits
      }, 
      token 
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const user = await db.User.findOne({ 
      where: { username }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is inactive. Please contact support.');
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '24h' }
    );

    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        credits: user.credits,
        commission: user.commission
      }, 
      token 
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.User.findOne({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      credits: user.credits,
      commission: user.commission
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
