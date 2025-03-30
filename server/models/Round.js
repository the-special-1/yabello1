const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Round = sequelize.define('Round', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
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
    currentRound: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  Round.associate = (models) => {
    Round.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Round.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
  };

  return Round;
};
