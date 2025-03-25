const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth } = require('../middleware/auth');

// Get user balance and commission info
router.get('/balance', auth, async (req, res) => {
  try {
    // Set no-cache headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    console.log('User ID:', req.user.id); // Debug log
    const user = await db.User.findByPk(req.user.id, {
      include: [{
        model: db.Branch,
        as: 'branch',
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const credits = parseFloat(user.credits || 0);
    console.log('Raw user.credits:', user.credits);
    console.log('Parsed credits:', credits);
    console.log('Response data:', { credits });

    // If user is an agent, get branch commission info
    if (user.role === 'agent') {
      res.json({
        credits: credits,
        commission: user.commission,
        branch: user.branch
      });
    } else {
      res.json({
        credits: credits
      });
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Error fetching user balance' });
  }
});

// Get users under the agent's branch
router.get('/my-users', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user || user.role !== 'agent') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await db.User.findAll({
      where: {
        branchId: user.branchId,
        role: 'user'
      },
      attributes: ['id', 'username', 'credits', 'status', 'createdAt', 'cut']
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get current user's data including cut
router.get('/my-data', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'credits', 'status', 'cut', 'role']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Create a new user under the agent's branch
router.post('/create-user', auth, async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const agent = await db.User.findByPk(req.user.id);
    if (!agent || agent.role !== 'agent') {
      await t.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { username, password, cut } = req.body;

    // Check if username already exists
    const existingUser = await db.User.findOne({
      where: { username }
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate cut percentage
    if (cut < 0 || cut > 100) {
      await t.rollback();
      return res.status(400).json({ message: 'Cut percentage must be between 0 and 100' });
    }

    // Create new user
    const newUser = await db.User.create({
      username,
      password,
      role: 'user',
      cut,
      branchId: agent.branchId,
      createdBy: agent.id,
      credits: process.env.DEFAULT_USER_CREDITS || 0
    }, { transaction: t });

    await t.commit();
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      credits: parseFloat(newUser.credits || 0),
      status: newUser.status
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

module.exports = router;
