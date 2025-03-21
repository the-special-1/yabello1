const express = require('express');
const router = express.Router();
const db = require('../models');
const { auth, authorize } = require('../middleware/auth');

// Generate random bingo numbers
router.post('/generate', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    // Initialize 5x5 grid
    const grid = Array(5).fill().map(() => Array(5).fill(null));
    const usedNumbers = new Set();

    // Column ranges for B-I-N-G-O
    const columnRanges = [
      [1, 15],   // B: 1-15
      [16, 30],  // I: 16-30
      [31, 45],  // N: 31-45
      [46, 60],  // G: 46-60
      [61, 75]   // O: 61-75
    ];

    // Fill each column with random numbers from its range
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        // Skip the center cell (FREE space)
        if (row === 2 && col === 2) {
          grid[row][col] = 'FREE';
          continue;
        }

        const [min, max] = columnRanges[col];
        let number;
        do {
          number = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(number));

        usedNumbers.add(number);
        grid[row][col] = number;
      }
    }

    res.json({ numbers: grid });
  } catch (error) {
    console.error('Generate numbers error:', error);
    res.status(400).json({ error: error.message || 'Failed to generate numbers' });
  }
});

// Create a new cartella
router.post('/', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const { id, numbers, branchId } = req.body;

    console.log('Creating cartella request:', { 
      id, 
      branchId,
      userRole: req.user.role,
      numbers 
    });

    // Validate required fields
    if (!id || !branchId || !numbers) {
      console.error('Missing required fields:', { id, branchId, numbers });
      return res.status(400).json({ error: 'Cartella ID, branch, and numbers are required' });
    }

    // Validate ID is numeric and within limits
    if (!/^\d+$/.test(id) || id.length > 10) {
      console.error('Invalid cartella ID format:', id);
      return res.status(400).json({ error: 'Cartella ID must be numeric and at most 10 digits' });
    }

    // Check if cartella ID already exists in the same branch
    const existingCartella = await db.Cartella.findOne({
      where: {
        id,
        branchId
      }
    });
    if (existingCartella) {
      console.error('Duplicate cartella ID in branch:', { id, branchId });
      return res.status(400).json({ error: 'A cartella with this ID already exists in this branch' });
    }

    // Verify branch exists and is active
    const branch = await db.Branch.findOne({
      where: {
        id: branchId,
        status: 'active'
      }
    });

    if (!branch) {
      console.error('Branch not found or inactive:', branchId);
      return res.status(400).json({ error: 'Branch not found or inactive' });
    }

    // Validate numbers grid structure
    if (!Array.isArray(numbers) || numbers.length !== 5) {
      console.error('Invalid grid structure:', numbers);
      return res.status(400).json({ error: 'Grid must be a 5x5 array' });
    }

    for (let i = 0; i < 5; i++) {
      if (!Array.isArray(numbers[i]) || numbers[i].length !== 5) {
        console.error('Invalid row structure:', numbers[i]);
        return res.status(400).json({ error: 'Each row must have exactly 5 numbers' });
      }

      for (let j = 0; j < 5; j++) {
        if (i === 2 && j === 2) {
          if (numbers[i][j] !== 'FREE') {
            return res.status(400).json({ error: 'Center space must be FREE' });
          }
          continue;
        }
        const num = numbers[i][j];
        if (!Number.isInteger(num) || num < 1 || num > 75) {
          console.error('Invalid number:', { row: i, col: j, value: num });
          return res.status(400).json({ error: 'Numbers must be integers between 1 and 75' });
        }
      }
    }

    // Check for duplicate numbers
    const flatNumbers = numbers.flat().filter((num, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      return !(row === 2 && col === 2);
    });

    if (new Set(flatNumbers).size !== flatNumbers.length) {
      console.error('Duplicate numbers found:', flatNumbers);
      return res.status(400).json({ error: 'Duplicate numbers are not allowed' });
    }

    // Create cartella
    const cartella = await db.Cartella.create({
      id,
      branchId,
      numbers,
      createdBy: req.user.id,
      status: 'available'
    });

    console.log('Cartella created successfully:', cartella.id);
    res.status(201).json(cartella);
  } catch (error) {
    console.error('Create cartella error:', error);
    res.status(400).json({ error: error.message || 'Failed to create cartella' });
  }
});

// Get all cartellas for current branch
router.get('/branch/current', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    // For agents, only show cartellas from their branch
    if (req.user.role === 'agent') {
      where.branchId = req.user.branchId;
    }

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    const cartellas = await db.Cartella.findAll({
      where,
      include: [
        {
          model: db.Branch,
          as: 'branch',
          attributes: ['id', 'name', 'location']
        },
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(cartellas);
  } catch (error) {
    console.error('Get cartellas error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cartella
router.put('/:id', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const { numbers } = req.body;
    const cartella = await db.Cartella.findByPk(req.params.id);

    if (!cartella) {
      return res.status(404).json({ error: 'Cartella not found' });
    }

    // Verify ownership
    if (cartella.branchId !== req.user.branchId) {
      return res.status(403).json({ error: 'You can only update cartellas from your branch' });
    }

    // Only allow updates if cartella is available
    if (cartella.status !== 'available') {
      return res.status(400).json({ error: 'Cannot update cartella that is not available' });
    }

    // Validate numbers if provided
    if (numbers) {
      // Validate grid structure
      if (!Array.isArray(numbers) || numbers.length !== 5) {
        return res.status(400).json({ error: 'Grid must be a 5x5 array' });
      }

      for (let i = 0; i < 5; i++) {
        if (!Array.isArray(numbers[i]) || numbers[i].length !== 5) {
          return res.status(400).json({ error: 'Each row must have exactly 5 numbers' });
        }

        for (let j = 0; j < 5; j++) {
          if (i === 2 && j === 2) {
            if (numbers[i][j] !== 'FREE') {
              return res.status(400).json({ error: 'Center space must be FREE' });
            }
            continue;
          }
          const num = numbers[i][j];
          if (!Number.isInteger(num) || num < 1 || num > 75) {
            return res.status(400).json({ error: 'Numbers must be integers between 1 and 75' });
          }
        }
      }

      // Check for duplicates
      const flatNumbers = numbers.flat().filter((num, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        return !(row === 2 && col === 2);
      });

      if (new Set(flatNumbers).size !== flatNumbers.length) {
        return res.status(400).json({ error: 'Duplicate numbers are not allowed' });
      }
    }

    await cartella.update({ numbers });
    res.json(cartella);
  } catch (error) {
    console.error('Update cartella error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update cartella status
router.patch('/:id/status', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  try {
    const { status } = req.body;
    const cartella = await db.Cartella.findByPk(req.params.id);

    if (!cartella) {
      return res.status(404).json({ error: 'Cartella not found' });
    }

    // Verify ownership
    if (cartella.branchId !== req.user.branchId) {
      return res.status(403).json({ error: 'You can only update cartellas from your branch' });
    }

    // Validate status transition
    const validTransitions = {
      'available': ['sold'],
      'sold': ['playing'],
      'playing': ['won', 'lost'],
      'won': [],
      'lost': []
    };

    if (!validTransitions[cartella.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${cartella.status} to ${status}` 
      });
    }

    await cartella.update({ status });
    res.json(cartella);
  } catch (error) {
    console.error('Update cartella status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a cartella
router.delete('/:id/:branchId', auth, authorize(['superadmin', 'agent']), async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const cartella = await db.Cartella.findOne({
      where: {
        id: req.params.id,
        branchId: req.params.branchId
      },
      transaction: t
    });

    if (!cartella) {
      await t.rollback();
      return res.status(404).json({ error: 'Cartella not found' });
    }

    // Check if user has permission to delete this cartella
    if (req.user.role !== 'superadmin' && cartella.branchId !== req.user.branchId) {
      await t.rollback();
      return res.status(403).json({ error: 'Not authorized to delete this cartella' });
    }

    await cartella.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Cartella deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete cartella error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete cartella' });
  }
});

module.exports = router;
