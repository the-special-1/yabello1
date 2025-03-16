const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const usersRoutes = require('./users');
const cartellasRoutes = require('./cartellas');
const gamesRoutes = require('./games');
const transactionsRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const branchesRoutes = require('./branches');

// API routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/cartellas', cartellasRoutes);
router.use('/games', gamesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/branches', branchesRoutes);

module.exports = router;
