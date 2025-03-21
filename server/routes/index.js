const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const usersRoutes = require('./users');
const cartellasRoutes = require('./cartellas');
const transactionsRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const branchesRoutes = require('./branches');
const salesRoutes = require('./sales');

// API routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/cartellas', cartellasRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/branches', branchesRoutes);
router.use('/sales', salesRoutes);

module.exports = router;
