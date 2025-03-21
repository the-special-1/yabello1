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
      },
      set(value) {
        // Don't update credits for superadmin
        if (this.role === 'superadmin') {
          this.setDataValue('credits', Number.MAX_SAFE_INTEGER);
        } else {
          this.setDataValue('credits', value);
        }
      },
      validate: {
        min: 0,
        isNotNegative(value) {
          if (this.role !== 'superadmin' && parseFloat(value) < 0) {
            throw new Error('Credits cannot be negative');
          }
        }
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
    }
  }, {
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && user.role !== 'system') {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.role !== 'system') {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

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
      as: 'sentTransactions'
    });

    User.hasMany(models.Transaction, {
      foreignKey: 'receiverId',
      as: 'receivedTransactions'
    });
  };

  return User;
};
