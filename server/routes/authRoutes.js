const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, branchId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with starting credits
    const user = await User.create({
      username,
      password: hashedPassword,
      branchId,
      role: 'user',
      status: 'active',
      credits: 1000 // Default starting credits for new users
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
        credits: parseFloat(user.credits || 0)
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Special case for superadmin
    let validPassword = false;
    if (username === 'superadmin') {
      // For superadmin, we're using a fixed password
      validPassword = password === 'admin123';
    } else {
      // For regular users, use bcrypt
      validPassword = await bcrypt.compare(password, user.password);
    }

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
        credits: parseFloat(user.credits || 0)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      credits: parseFloat(user.credits || 0),
      status: user.status
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Error getting user information' });
  }
});

module.exports = router;
