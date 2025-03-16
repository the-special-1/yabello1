const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cartella = sequelize.define('Cartella', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      validate: {
        isNumeric: true,
        len: [1, 10]
      }
    },
    numbers: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidBingoCard(value) {
          // Must be 5x5 array
          if (!Array.isArray(value) || value.length !== 5) {
            throw new Error('Bingo card must be a 5x5 grid');
          }

          for (let i = 0; i < 5; i++) {
            if (!Array.isArray(value[i]) || value[i].length !== 5) {
              throw new Error('Each row must have exactly 5 numbers');
            }
          }

          // Check for duplicates and ranges, excluding FREE space
          const usedNumbers = new Set();
          const columnRanges = [
            [1, 15],   // B: 1-15
            [16, 30],  // I: 16-30
            [31, 45],  // N: 31-45
            [46, 60],  // G: 46-60
            [61, 75]   // O: 61-75
          ];

          for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
              // Skip FREE space
              if (row === 2 && col === 2) {
                if (value[row][col] !== 'FREE') {
                  throw new Error('Center space must be FREE');
                }
                continue;
              }

              const num = value[row][col];
              
              // Check if number is in valid range for its column
              const [min, max] = columnRanges[col];
              if (!Number.isInteger(num) || num < min || num > max) {
                throw new Error(`Numbers in column ${col} must be between ${min} and ${max}`);
              }

              // Check for duplicates
              if (usedNumbers.has(num)) {
                throw new Error('Duplicate numbers are not allowed');
              }
              usedNumbers.add(num);
            }
          }
        }
      }
    },
    branchId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Branches',
        key: 'id'
      }
    },
    gameId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Games',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'sold', 'playing', 'won', 'lost'),
      defaultValue: 'available',
      validate: {
        isIn: [['available', 'sold', 'playing', 'won', 'lost']]
      }
    },
    markedNumbers: {
      type: DataTypes.JSONB,
      defaultValue: Array(5).fill().map(() => Array(5).fill(false)),
      validate: {
        isValidMarks(value) {
          if (!Array.isArray(value) || value.length !== 5) {
            throw new Error('Marked numbers must be a 5x5 grid of booleans');
          }

          for (let i = 0; i < 5; i++) {
            if (!Array.isArray(value[i]) || value[i].length !== 5) {
              throw new Error('Each row must have exactly 5 marks');
            }

            for (let j = 0; j < 5; j++) {
              if (typeof value[i][j] !== 'boolean') {
                throw new Error('Each mark must be a boolean');
              }
            }
          }
        }
      }
    },
    winningPattern: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['row', 'column', 'diagonal', 'corners', null]]
      }
    }
  }, {
    indexes: [
      {
        fields: ['branchId']
      },
      {
        fields: ['gameId']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['status']
      }
    ]
  });

  Cartella.associate = (models) => {
    // Cartella belongs to a branch
    Cartella.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });

    // Cartella belongs to a game
    Cartella.belongsTo(models.Game, {
      foreignKey: 'gameId',
      as: 'game',
      constraints: false
    });

    // Cartella belongs to a creator (agent)
    Cartella.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Cartella;
};
