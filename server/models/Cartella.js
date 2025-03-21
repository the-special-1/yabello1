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
              const num = value[row][col];
              
              // Skip validation for FREE space
              if (num === 'FREE') {
                if (row === 2 && col === 2) continue;
                throw new Error('FREE space must be in the center');
              }

              // Validate number
              const numValue = parseInt(num);
              if (isNaN(numValue)) {
                throw new Error('Invalid number in card');
              }

              // Check range for column
              const [min, max] = columnRanges[col];
              if (numValue < min || numValue > max) {
                throw new Error(`Number ${numValue} is out of range for column ${col + 1}`);
              }

              // Check for duplicates
              if (usedNumbers.has(numValue)) {
                throw new Error('Duplicate number in card');
              }
              usedNumbers.add(numValue);
            }
          }
        }
      }
    },
    branchId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true, 
      references: {
        model: 'Branches',
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
    markedNumbers: {
      type: DataTypes.JSONB,
      defaultValue: Array(5).fill().map(() => Array(5).fill(false)),
      validate: {
        isValidMarkedNumbers(value) {
          if (!Array.isArray(value) || value.length !== 5) {
            throw new Error('Marked numbers must be a 5x5 grid');
          }

          for (let i = 0; i < 5; i++) {
            if (!Array.isArray(value[i]) || value[i].length !== 5) {
              throw new Error('Each row must have exactly 5 cells');
            }

            for (let j = 0; j < 5; j++) {
              if (typeof value[i][j] !== 'boolean') {
                throw new Error('Each cell must be a boolean value');
              }
            }
          }
        }
      }
    },
    winningPattern: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['', 'line', 'diagonal', 'corners', 'full']]
      }
    }
  }, {
    indexes: [
      {
        fields: ['branchId']
      }
    ]
  });

  Cartella.associate = (models) => {
    Cartella.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
    Cartella.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Cartella;
};
