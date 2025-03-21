const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Get all agents (for superadmin)
router.get('/agents', auth, authorize(['superadmin']), async (req, res) => {
  try {
    const agents = await db.User.findAll({
      where: { role: 'agent' },
      include: [{
        model: db.Branch,
        as: 'branch',
        attributes: ['id', 'name', 'location']
      }],
      attributes: { 
        exclude: ['password']
      }
    });
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create agent (superadmin only)
router.post('/create-agent', auth, authorize(['superadmin']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, branchId, commission } = req.body;

    if (!username || !password || !branchId || commission === undefined) {
      throw new Error('Username, password, branch, and commission are required');
    }

    // Validate branch exists
    const branch = await db.Branch.findByPk(branchId, { transaction: t });
    if (!branch) {
      throw new Error('Invalid branch');
    }

    // Check if username exists
    const existingUser = await db.User.findOne({ 
      where: { username },
      transaction: t
    });
    
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create agent - let the model hook handle password hashing
    const agent = await db.User.create({
      username,
      password,
      role: 'agent',
      branchId,
      commission,
      status: 'active',
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();

    // Return agent without password
    const agentResponse = agent.toJSON();
    delete agentResponse.password;
    
    res.status(201).json(agentResponse);
  } catch (error) {
    await t.rollback();
    console.error('Create agent error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all users (filtered by role)
router.get('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const where = {};
    
    // Agents can only see their users
    if (req.user.role === 'agent') {
      where.createdBy = req.user.id;
      where.role = 'user';
    }
    
    // Superadmin can filter by role
    if (req.user.role === 'superadmin' && req.query.role) {
      where.role = req.query.role;
    }

    const users = await db.User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get users created by current user
router.get('/my-users', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const where = {
      createdBy: req.user.id
    };
    
    if (req.user.role === 'agent') {
      where.role = 'user';
    }

    const users = await db.User.findAll({
      where,
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error('Get my users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'credits', 'commission']
    });

    if (!user) {
      throw new Error('User not found');
    }

    res.json({
      credits: user.credits,
      commission: user.commission
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer credits
router.post('/transfer-credits', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { receiverId, amount } = req.body;
    
    if (!receiverId || !amount || amount <= 0) {
      throw new Error('Valid receiver and amount are required');
    }

    console.log('Credit transfer request:', {
      senderId: req.user.id,
      senderRole: req.user.role,
      receiverId,
      amount
    });

    const sender = await db.User.findByPk(req.user.id, { transaction: t });
    const receiver = await db.User.findByPk(receiverId, { transaction: t });

    if (!receiver) {
      throw new Error('Receiver not found');
    }

    console.log('Credit transfer participants:', {
      sender: {
        id: sender.id,
        role: sender.role,
        credits: sender.credits
      },
      receiver: {
        id: receiver.id,
        role: receiver.role,
        credits: receiver.credits
      }
    });

    // Validate hierarchical transfer rules
    if (req.user.role === 'superadmin' && receiver.role !== 'agent') {
      throw new Error('Superadmin can only transfer credits to agents');
    }

    if (req.user.role === 'agent' && receiver.role !== 'user') {
      throw new Error('Agents can only transfer credits to users');
    }

    if (sender.credits < amount && sender.role !== 'superadmin') {
      throw new Error('Insufficient credits');
    }

    // Calculate new balances
    const newSenderCredits = sender.role === 'superadmin' ? sender.credits : parseFloat((sender.credits - amount).toFixed(2));
    const newReceiverCredits = parseFloat((parseFloat(receiver.credits) + parseFloat(amount)).toFixed(2));

    console.log('Credit transfer amounts:', {
      currentSenderCredits: sender.credits,
      newSenderCredits,
      currentReceiverCredits: receiver.credits,
      newReceiverCredits,
      amount
    });

    // Validate branch hierarchy for agents
    if (sender.role === 'agent' && receiver.branchId !== sender.branchId) {
      throw new Error('Agents can only transfer credits to users in their branch');
    }

    // Update sender credits (skip for superadmin)
    if (sender.role !== 'superadmin') {
      await sender.update({
        credits: newSenderCredits
      }, { transaction: t });
    }

    // Update receiver credits
    await receiver.update({
      credits: newReceiverCredits
    }, { transaction: t });

    // Record transaction
    const transaction = await db.Transaction.create({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: parseFloat(amount),
      type: sender.role === 'superadmin' ? 'credit_creation' : 'credit_transfer',
      status: 'completed',
      description: sender.role === 'superadmin' 
        ? `Credit creation by ${sender.username} for ${receiver.username}`
        : `Credit transfer from ${sender.username} to ${receiver.username}`
    }, { transaction: t });

    await t.commit();
    
    // Fetch fresh data after commit
    const updatedReceiver = await db.User.findByPk(receiverId);
    const updatedSender = sender.role !== 'superadmin' ? await db.User.findByPk(sender.id) : sender;

    res.json({ 
      message: sender.role === 'superadmin' ? 'Credits created successfully' : 'Credits transferred successfully',
      transaction: {
        id: transaction.id,
        amount: parseFloat(amount),
        type: sender.role === 'superadmin' ? 'credit_creation' : 'credit_transfer',
        status: 'completed'
      },
      sender: {
        id: updatedSender.id,
        credits: updatedSender.credits
      },
      receiver: {
        id: updatedReceiver.id,
        credits: updatedReceiver.credits
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Transfer credits error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create new user
router.post('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, role, credits = 0, commission = 0 } = req.body;

    // Basic validation
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if username exists
    const existingUser = await db.User.findOne({ 
      where: { username },
      transaction: t
    });
    
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate role based on creator's role
    if (req.user.role === 'agent' && role !== 'user') {
      throw new Error('Agents can only create users');
    }

    if (req.user.role === 'superadmin' && !['agent', 'user'].includes(role)) {
      throw new Error('Invalid role');
    }

    // Create user
    const user = await db.User.create({
      username,
      password,
      role,
      credits,
      commission,
      status: 'active',
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    await t.rollback();
    console.error('Create user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create user (agent only)
router.post('/create-user', auth, authorize(['agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, credits = 0 } = req.body;

    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    // Check if username exists
    const existingUser = await db.User.findOne({ 
      where: { username },
      transaction: t
    });
    
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create user with agent's branch
    const user = await db.User.create({
      username,
      password,
      role: 'user',
      branchId: req.user.branchId,
      credits,
      commission: 0,
      status: 'active',
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    await t.rollback();
    console.error('Create user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put('/:id', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, commission, status, credits, branchId } = req.body;
    const user = await db.User.findByPk(req.params.id, { transaction: t });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate permissions
    if (req.user.role === 'agent') {
      if (user.createdBy !== req.user.id || user.role !== 'user') {
        throw new Error('Unauthorized to update this user');
      }
    }

    // Prepare updates
    const updates = {};
    
    if (username && username !== user.username) {
      const existingUser = await db.User.findOne({ 
        where: { username },
        transaction: t 
      });
      if (existingUser) {
        throw new Error('Username already exists');
      }
      updates.username = username;
    }

    if (password) {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (typeof commission === 'number') {
      updates.commission = commission;
    }

    if (typeof credits === 'number' && credits >= 0) {
      updates.credits = credits;
    }

    if (status && ['active', 'inactive'].includes(status)) {
      updates.status = status;
    }

    if (branchId && req.user.role === 'superadmin') {
      const branch = await db.Branch.findByPk(branchId, { transaction: t });
      if (!branch) {
        throw new Error('Invalid branch');
      }
      updates.branchId = branchId;
    }

    // Update user
    await user.update(updates, { transaction: t });
    await t.commit();

    // Return updated user without password
    const updatedUser = await db.User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    await t.rollback();
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const user = await db.User.findByPk(req.params.id, { transaction: t });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate permissions
    if (req.user.role === 'agent') {
      if (user.createdBy !== req.user.id || user.role !== 'user') {
        throw new Error('Unauthorized to delete this user');
      }
    }

    await user.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete user error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
