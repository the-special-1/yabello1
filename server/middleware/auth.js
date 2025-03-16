const jwt = require('jsonwebtoken');
const db = require('../models');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user with branch info
    const user = await db.User.findOne({
      where: { id: decoded.id },
      include: [
        {
          model: db.Branch,
          as: 'branch',
          attributes: ['id', 'name', 'location', 'status'],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // For agents, check if their branch is active
    if (user.role === 'agent' && (!user.branch || user.branch.status !== 'active')) {
      return res.status(403).json({ error: 'Your branch is inactive or not found' });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. You do not have permission to perform this action.' 
      });
    }

    // For agents, validate branch-specific actions
    if (req.user.role === 'agent') {
      const branchId = req.body.branchId || req.params.branchId;
      
      // Skip branch validation if no branchId is provided
      if (!branchId) {
        next();
        return;
      }

      // Convert both IDs to strings for comparison
      const userBranchId = String(req.user.branchId);
      const requestedBranchId = String(branchId);

      console.log('Branch validation:', {
        userBranchId,
        requestedBranchId,
        match: userBranchId === requestedBranchId
      });

      if (userBranchId !== requestedBranchId) {
        return res.status(403).json({ 
          error: 'You can only perform actions for your assigned branch' 
        });
      }
    }

    next();
  };
};

module.exports = { auth, authorize };
