module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Transactions', 'gameId', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Games',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Transactions', 'gameId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Games',
        key: 'id'
      }
    });
  }
};
