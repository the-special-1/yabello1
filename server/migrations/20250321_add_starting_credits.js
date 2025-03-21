'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Update all users with role 'user' to have 1000 credits if they have 0 or null credits
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET credits = 1000
        WHERE role = 'user' AND (credits IS NULL OR credits = 0);
      `);
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No need for down migration as we don't want to remove credits
  }
};
