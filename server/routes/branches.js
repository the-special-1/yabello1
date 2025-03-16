const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Get all branches (or just own branch for agents)
router.get('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    // Return all active branches for both superadmin and agent
    const branches = await db.Branch.findAll({
      where: { status: 'active' },
      include: [{
        model: db.User,
        as: 'users',
        where: { role: 'agent' },
        attributes: ['id', 'username', 'credits', 'commission', 'status'],
        required: false
      }]
    });
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new branch
router.post('/', auth, authorize(['superadmin']), async (req, res) => {
  try {
    const { name, location } = req.body;
    
    if (!name || !location) {
      throw new Error('Name and location are required');
    }

    const branch = await db.Branch.create({
      name,
      location,
      status: 'active'
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update a branch
router.put('/:id', auth, authorize(['superadmin']), async (req, res) => {
  try {
    const { name, location, status } = req.body;
    const branch = await db.Branch.findByPk(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await branch.update({ 
      name: name || branch.name,
      location: location || branch.location,
      status: status || branch.status
    });
    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a branch
router.delete('/:id', auth, authorize(['superadmin']), async (req, res) => {
  try {
    const branch = await db.Branch.findByPk(req.params.id);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if branch has any users
    const usersCount = await db.User.count({ where: { branchId: branch.id } });
    if (usersCount > 0) {
      return res.status(400).json({ error: 'Cannot delete branch with active users' });
    }

    await branch.destroy();
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
