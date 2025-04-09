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
    let query = {
      include: [
        { 
          model: db.Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    };

    // Agents can only see users they created in their branch
    if (req.user.role === 'agent') {
      query.where = {
        createdBy: req.user.id,
        branchId: req.user.branchId
      };
    }

    const users = await db.User.findAll(query);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(400).json({ error: error.message });
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
      attributes: ['id', 'username', 'credits', 'commission', 'cut'],
      include: [{
        model: db.Branch,
        as: 'branch',
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    res.json({
      credits: user.credits,
      commission: user.commission,
      cut: user.cut,
      branch: user.branch
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

    const sender = await db.User.findByPk(req.user.id, { transaction: t });
    const receiver = await db.User.findByPk(receiverId, { transaction: t });

    if (!receiver) {
      throw new Error('Receiver not found');
    }

    // For superadmin, skip credit check
    if (sender.role !== 'superadmin' && sender.credits < amount) {
      throw new Error('Insufficient credits');
    }

    // Update sender credits (skip for superadmin)
    if (sender.role !== 'superadmin') {
      await sender.update({
        credits: sender.credits - amount
      }, { transaction: t });
    }

    // Update receiver credits using string operations for precision
    const newCredits = (parseFloat(receiver.credits) + parseFloat(amount)).toFixed(2);
    await receiver.update({
      credits: newCredits
    }, { transaction: t });

    // Create transaction record
    await db.Transaction.create({
      senderId: sender.id,
      receiverId: receiver.id,
      amount,
      type: 'credit_transfer'
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Credits transferred successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Transfer credits error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create user
router.post('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, credits } = req.body;

    if (!username || !password || credits === undefined) {
      throw new Error('Username, password, and credits are required');
    }

    // Check if username exists
    const existingUser = await db.User.findOne({ 
      where: { username },
      transaction: t
    });
    
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create user
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

// Update user cut
router.post('/cut-update', auth, authorize(['user']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { cut } = req.body;

    // Validate cut value
    if (cut < 0 || cut > 100) {
      throw new Error('Cut must be between 0 and 100');
    }

    // Update user cut
    await db.User.update(
      { cut: cut },
      { where: { id: req.user.id }, transaction: t }
    );

    await t.commit();
    res.json({ message: 'Cut updated successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating cut:', error);
    res.status(400).json({ message: error.message || 'Failed to update cut' });
  }
});

// Update user
router.put('/:id', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, commission, status, credits, branchId, cut } = req.body;
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
      updates.password = password; 
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

    if (typeof cut === 'number' && cut >= 0 && cut <= 100) {
      updates.cut = cut;
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
    const userToDelete = await db.User.findByPk(req.params.id, {
      include: [
        { model: db.Branch, as: 'branch' },
        { model: db.Transaction, as: 'sentTransactions' },
        { model: db.Transaction, as: 'receivedTransactions' },
        { model: db.Cartella, as: 'createdCartellas' },
        { model: db.Report, as: 'reports' }
      ],
      transaction: t
    });

    if (!userToDelete) {
      throw new Error('User not found');
    }

    // Validate permissions
    if (req.user.role === 'agent') {
      // Check both branch and creator
      if (userToDelete.branch.id !== req.user.branchId || 
          userToDelete.createdBy !== req.user.id || 
          userToDelete.role !== 'user') {
        throw new Error('Unauthorized to delete this user');
      }
    }

    // Delete all transactions first
    await db.Transaction.destroy({
      where: {
        [db.Sequelize.Op.or]: [
          { senderId: userToDelete.id },
          { receiverId: userToDelete.id }
        ]
      },
      transaction: t
    });

    // Handle Cartellas before deleting user
    if (userToDelete.role === 'agent') {
      // For agents, reassign their created Cartellas to the superadmin
      const superadmin = await db.User.findOne({
        where: { role: 'superadmin' },
        transaction: t
      });

      if (!superadmin) {
        throw new Error('No superadmin found to reassign Cartellas');
      }

      await db.Cartella.update(
        { createdBy: superadmin.id },
        { 
          where: { createdBy: userToDelete.id },
          transaction: t
        }
      );

      // For agents, also reassign their reports to superadmin
      await db.Report.update(
        { userId: superadmin.id },
        {
          where: { userId: userToDelete.id },
          transaction: t
        }
      );
    } else {
      // For regular users, we can delete their Cartellas and reports
      await db.Cartella.destroy({
        where: { createdBy: userToDelete.id },
        transaction: t
      });

      await db.Report.destroy({
        where: { userId: userToDelete.id },
        transaction: t
      });
    }

    // Then delete the user
    await userToDelete.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete user error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
