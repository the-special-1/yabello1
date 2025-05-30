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
  // Log the request body to help debug
  console.log('Create user request body:', req.body);
  console.log('Request headers:', req.headers);
  
  let t;
  
  try {
    t = await db.sequelize.transaction();
    
    try {
      // Verify agent authorization
      console.log('Agent ID:', req.user?.id);
      console.log('Agent role:', req.user?.role);
      
      const agent = await db.User.findByPk(req.user.id);
      if (!agent) {
        console.error('Agent not found with ID:', req.user.id);
        await t.rollback();
        return res.status(403).json({ message: 'Agent not found' });
      }
      
      if (agent.role !== 'agent') {
        console.error('User is not an agent. Role:', agent.role);
        await t.rollback();
        return res.status(403).json({ message: 'Unauthorized - Not an agent' });
      }

      // Extract and validate username
      const username = req.body.username;
      const password = req.body.password;
      const cut = req.body.cut;
      
      console.log('Extracted values:', { 
        username: username || 'undefined', 
        password: password ? '****' : 'undefined', 
        cut: cut || 'undefined' 
      });
      
      // Validate required fields
      if (!username) {
        await t.rollback();
        return res.status(400).json({ message: 'Username is required' });
      }
      
      if (!password) {
        await t.rollback();
        return res.status(400).json({ message: 'Password is required' });
      }
      
      // Check if username already exists
      try {
        const existingUser = await db.User.findOne({
          where: { username: String(username) }
        });

        if (existingUser) {
          await t.rollback();
          return res.status(400).json({ message: 'Username already exists' });
        }
      } catch (findError) {
        console.error('Error checking for existing username:', findError);
        await t.rollback();
        return res.status(500).json({ message: 'Error checking username' });
      }

      // Validate cut percentage
      if (cut < 0 || cut > 100) {
        await t.rollback();
        return res.status(400).json({ message: 'Cut percentage must be between 0 and 100' });
      }

      // Create new user with explicit values
      try {
        console.log('Creating user with values:', {
          username: username,
          password: '****',
          role: 'user',
          cut: cut,
          branchId: agent.branchId,
          createdBy: agent.id
        });
        
        const newUser = await db.User.create({
          username: String(username),
          password: String(password),
          role: 'user',
          cut: parseFloat(cut),
          branchId: agent.branchId,
          createdBy: agent.id,
          credits: process.env.DEFAULT_USER_CREDITS || 0
        }, { transaction: t });

        await t.commit();
        console.log('User created successfully:', newUser.id);
        return res.status(201).json({ message: 'User created successfully', userId: newUser.id });
      } catch (createError) {
        console.error('Error in db.User.create:', createError);
        await t.rollback();
        return res.status(500).json({ message: `Error creating user: ${createError.message}` });
      }
    } catch (innerError) {
      console.error('Inner try-catch error:', innerError);
      await t.rollback();
      return res.status(500).json({ message: `Inner error: ${innerError.message}` });
    }
  } catch (outerError) {
    console.error('Outer try-catch error:', outerError);
    if (t) await t.rollback();
    return res.status(500).json({ message: `Server error: ${outerError.message}` });
  }
});

module.exports = router;
