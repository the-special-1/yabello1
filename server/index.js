const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./models');
const routes = require('./routes');
const cartellaRoutes = require('./routes/cartellaRoutes');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cartellas', cartellaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
console.log('Starting server on port:', PORT);

// Create superadmin user
const createSuperAdmin = async () => {
  try {
    // Use a fixed password for superadmin (this is just for initial setup)
    const password = '$2a$10$YourFixedSaltAndHash';
    
    // First check if superadmin exists
    const existingAdmin = await db.User.findOne({
      where: { username: 'superadmin' }
    });

    if (existingAdmin) {
      console.log('Superadmin already exists, updating password...');
      await existingAdmin.update({ password });
      console.log('Superadmin password updated successfully');
      return;
    }

    // Create new superadmin if doesn't exist
    await db.User.create({
      username: 'superadmin',
      password,
      role: 'superadmin',
      status: 'active',
      credits: 0,
      commission: 0
    });
    console.log('Superadmin user created successfully');
  } catch (error) {
    console.error('Error with superadmin:', error);
    throw error;
  }
};

// Initialize database and start server
(async () => {
  try {
    // First, force sync to recreate tables
    await db.sequelize.sync({ force: true });
    
    // Create superadmin user
    await createSuperAdmin();

    // Log the superadmin details
    const admin = await db.User.findOne({
      where: { username: 'superadmin' }
    });
    console.log('Superadmin details:', {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      status: admin.status
    });
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();
