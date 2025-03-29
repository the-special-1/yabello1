'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GamePlayers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      gameId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Games',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cartellaId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Cartellas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      betAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('playing', 'won', 'lost'),
        allowNull: false,
        defaultValue: 'playing'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('GamePlayers', ['gameId']);
    await queryInterface.addIndex('GamePlayers', ['userId']);
    await queryInterface.addIndex('GamePlayers', ['cartellaId']);
    await queryInterface.addIndex('GamePlayers', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GamePlayers');
  }
};
