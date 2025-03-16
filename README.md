# Yabello Bingo

Ethiopia's Best Bingo Software - A full-stack bingo gaming platform with multi-tier user management.

## Features

- Three-tier user system (SuperAdmin, Agent, User)
- Credit management with commission system
- Interactive 5x5 Bingo card gameplay
- Real-time number drawing
- Automatic win detection
- Prize pool distribution with commission

## Tech Stack

- **Frontend**: React with Material-UI
- **Backend**: Express.js with PostgreSQL (Sequelize ORM)
- **Authentication**: JWT

## Project Structure

```
yabello1/
├── client/           # React frontend
│   ├── public/       # Static files
│   └── src/         # Source files
│       ├── pages/   # React components
│       └── context/ # Auth context
├── server/          # Express backend
│   ├── models/      # Sequelize models
│   ├── routes/      # API endpoints
│   ├── middleware/  # Auth middleware
│   └── utils/       # Helper functions
└── package.json     # Project dependencies
```

## Getting Started

1. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client && npm install

   # Install server dependencies
   cd server && npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values with your configuration

3. Start the development servers:
   ```bash
   # Start both client and server
   npm run dev
   ```

## License

Copyright © 2025 Yabello Bingo. All rights reserved.
