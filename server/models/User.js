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
        len: [6, 100]
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
        return value === null ? null : parseFloat(value);
      },
      validate: {
        min: 0,
        isNotNegative(value) {
          if (parseFloat(value) < 0) {
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
        if (user.role === 'superadmin' && !user.credits) {
          user.credits = process.env.DEFAULT_SUPERADMIN_CREDITS || 1000000;
        } else if (user.role === 'agent' && !user.credits) {
          user.credits = process.env.DEFAULT_AGENT_CREDITS || 1000;
        } else if (user.role === 'user' && !user.credits) {
          user.credits = process.env.DEFAULT_USER_CREDITS || 0;
        }
        if (user.role === 'agent' && !user.commission) {
          user.commission = process.env.DEFAULT_COMMISSION_RATE || 5;
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.associate = (models) => {
    // Self-referential associations
    User.belongsTo(models.User, {
      as: 'creator',
      foreignKey: 'createdBy',
      constraints: false
    });

    User.hasMany(models.User, {
      as: 'createdUsers',
      foreignKey: 'createdBy',
      constraints: false
    });

    // Branch association
    User.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });

    // Other associations
    User.hasMany(models.Game, {
      foreignKey: 'createdBy',
      as: 'createdGames'
    });

    User.hasMany(models.Cartella, {
      foreignKey: 'createdBy',
      as: 'createdCartellas'
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
