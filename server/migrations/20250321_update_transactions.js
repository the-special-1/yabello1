'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop the old enum type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_transactions_type CASCADE;');

      // Create new enum type with bet_placement
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_transactions_type AS ENUM (
          'credit_transfer',
          'game_stake',
          'game_win',
          'commission',
          'bet_placement'
        );
      `);

      // Allow receiverId to be null
      await queryInterface.changeColumn('Transactions', 'receiverId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop the new enum type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_transactions_type CASCADE;');

      // Create old enum type without bet_placement
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_transactions_type AS ENUM (
          'credit_transfer',
          'game_stake',
          'game_win',
          'commission'
        );
      `);

      // Make receiverId not null again
      await queryInterface.changeColumn('Transactions', 'receiverId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      });
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
