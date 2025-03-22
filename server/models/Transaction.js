const { DataTypes, Deferrable } = require('sequelize');

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
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['credit_transfer', 'credit_creation', 'game_stake', 'game_win', 'commission', 'bet_placement']]
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'completed', 'failed']]
      }
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
        deferrable: Deferrable.INITIALLY_IMMEDIATE
      }
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
        deferrable: Deferrable.INITIALLY_IMMEDIATE
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    modelName: 'Transaction',
    tableName: 'Transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['senderId']
      },
      {
        fields: ['receiverId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      as: 'sender',
      foreignKey: 'senderId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    Transaction.belongsTo(models.User, {
      as: 'receiver',
      foreignKey: 'receiverId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return Transaction;
};
