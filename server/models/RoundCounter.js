const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RoundCounter = sequelize.define('RoundCounter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    currentRound: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    branchId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  RoundCounter.associate = (models) => {
    RoundCounter.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
  };

  return RoundCounter;
};
