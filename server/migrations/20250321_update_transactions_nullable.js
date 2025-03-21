'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" 
      ALTER COLUMN "receiverId" DROP NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" 
      ALTER COLUMN "receiverId" SET NOT NULL;
    `);
  }
};
