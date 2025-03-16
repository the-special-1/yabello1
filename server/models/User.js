const { DataTypes, Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
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
      type: DataTypes.ENUM('superadmin', 'agent', 'user'),
      allowNull: false,
      validate: {
        isIn: [['superadmin', 'agent', 'user']]
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
      type: DataTypes.ENUM('active', 'inactive'),
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
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        if (user.role === 'superadmin' && !user.credits) {
          user.credits = 99999999.99; // Only set initial credits for new superadmins
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
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
