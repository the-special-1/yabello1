const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define custom enum types
  sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_type') THEN
        CREATE TYPE enum_transactions_type AS ENUM ('credit_transfer', 'game_stake', 'game_win', 'commission');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_status') THEN
        CREATE TYPE enum_transactions_status AS ENUM ('pending', 'completed', 'failed');
      END IF;
    END
    $$;
  `);

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
        isIn: [['credit_transfer', 'game_stake', 'game_win', 'commission']]
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

  return Transaction;
};
