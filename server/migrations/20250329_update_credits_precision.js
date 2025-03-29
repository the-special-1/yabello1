'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN credits TYPE numeric(15,2);
      ALTER TABLE "Transactions" ALTER COLUMN amount TYPE numeric(15,2);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN credits TYPE numeric(10,2);
      ALTER TABLE "Transactions" ALTER COLUMN amount TYPE numeric(10,2);
    `);
  }
};
