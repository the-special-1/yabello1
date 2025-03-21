'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop foreign keys
    await queryInterface.removeConstraint('Transactions', 'Transactions_senderId_fkey');
    await queryInterface.removeConstraint('Transactions', 'Transactions_receiverId_fkey');

    // Make columns nullable
    await queryInterface.changeColumn('Transactions', 'senderId', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.changeColumn('Transactions', 'receiverId', {
      type: Sequelize.UUID,
      allowNull: true
    });

    // Add foreign keys back with ON DELETE SET NULL
    await queryInterface.addConstraint('Transactions', {
      fields: ['senderId'],
      type: 'foreign key',
      name: 'Transactions_senderId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('Transactions', {
      fields: ['receiverId'],
      type: 'foreign key',
      name: 'Transactions_receiverId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop foreign keys
    await queryInterface.removeConstraint('Transactions', 'Transactions_senderId_fkey');
    await queryInterface.removeConstraint('Transactions', 'Transactions_receiverId_fkey');

    // Make columns non-nullable
    await queryInterface.changeColumn('Transactions', 'senderId', {
      type: Sequelize.UUID,
      allowNull: false
    });

    await queryInterface.changeColumn('Transactions', 'receiverId', {
      type: Sequelize.UUID,
      allowNull: false
    });

    // Add foreign keys back without ON DELETE SET NULL
    await queryInterface.addConstraint('Transactions', {
      fields: ['senderId'],
      type: 'foreign key',
      name: 'Transactions_senderId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Transactions', {
      fields: ['receiverId'],
      type: 'foreign key',
      name: 'Transactions_receiverId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  }
};
