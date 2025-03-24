const { DataTypes, Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  // Define custom enum types
  sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
        CREATE TYPE enum_users_role AS ENUM ('superadmin', 'agent', 'user', 'system');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_status') THEN
        CREATE TYPE enum_users_status AS ENUM ('active', 'inactive');
      END IF;
    END
    $$;
  `);

  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100],
        isValidForRole(value) {
          if (this.role === 'system' && value === 'not_accessible') {
            return true;
          }
          if (this.role !== 'system' && value === 'not_accessible') {
            throw new Error('Invalid password');
          }
          if (this.role !== 'system' && value.length < 6) {
            throw new Error('Password must be at least 6 characters long');
          }
          return true;
        }
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['superadmin', 'agent', 'user', 'system']]
      }
    },
    credits: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('credits');
        // Superadmin always has unlimited credits
        if (this.role === 'superadmin') {
          return Number.MAX_SAFE_INTEGER;
        }
        return value === null ? null : parseFloat(value);
      }
    },
    commission: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('commission');
        return value === null ? null : parseFloat(value);
      },
      validate: {
        min: 0,
        max: 100
      }
    },
    branchId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive']]
      }
    },
    cut: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      get() {
        const value = this.getDataValue('cut');
        return value === null ? null : parseFloat(value);
      },
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    indexes: [
      // Ensure only one agent per branch
      {
        unique: true,
        fields: ['branchId'],
        where: {
          role: 'agent'
        },
        name: 'unique_agent_per_branch'
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && user.password !== 'not_accessible') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password !== 'not_accessible') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.associate = (models) => {
    User.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });

    User.belongsTo(User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    User.hasMany(models.Transaction, {
      foreignKey: 'senderId',
      as: 'sentTransactions',
      onDelete: 'SET NULL'
    });

    User.hasMany(models.Transaction, {
      foreignKey: 'receiverId',
      as: 'receivedTransactions',
      onDelete: 'SET NULL'
    });
  };

  return User;
};
