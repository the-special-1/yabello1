const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    noPlayer: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    winnerPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    branchId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  Report.associate = (models) => {
    Report.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
    Report.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Report;
};
