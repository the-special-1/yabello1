const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    type: {
      type: DataTypes.ENUM('credit_transfer', 'game_stake', 'game_win', 'commission'),
      allowNull: false,
      validate: {
        isIn: [['credit_transfer', 'game_stake', 'game_win', 'commission']]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'completed', 'failed']]
      }
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
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
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    indexes: [
      {
        fields: ['senderId']
      },
      {
        fields: ['receiverId']
      },
      {
        fields: ['gameId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Transaction;
};
