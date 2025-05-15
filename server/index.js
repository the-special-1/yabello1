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
const reportRoutes = require('./routes/reports');
const roundCounterRoutes = require('./routes/roundCounter');
const roundRoutes = require('./routes/rounds');

const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://www.yabellobingo.com',
  'https://www.yabellobingo.com'
];

// Middleware
// app.use(cors({
//   origin: function(origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true









}));
app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cartellas', cartellaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rounds', roundRoutes);
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
    // Check if superadmin already exists
    const existingAdmin = await db.User.findOne({
      where: { username: 'superadmin' }
    });

    if (existingAdmin) {
      console.log('Superadmin already exists');
      return;
    }

    // Create new superadmin if it doesn't exist
    const hashedPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'superadmin123', 10);
    const superadmin = await db.User.create({
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      status: 'active',
      credits: 0,
      commission: 0
    });

    console.log('Superadmin created successfully');
    return superadmin;
  } catch (error) {
    console.error('Error creating superadmin:', error);
    throw error;
  }
};

// Initialize database and start server
(async () => {
  try {
    // Sync database without forcing recreation
    await db.sequelize.sync();
    console.log('Database synchronized successfully');
    
    // Ensure superadmin exists
    await createSuperAdmin();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();
