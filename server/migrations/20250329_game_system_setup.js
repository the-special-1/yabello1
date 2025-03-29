'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Games table
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_games_status') THEN
          CREATE TYPE enum_games_status AS ENUM ('active', 'completed', 'cancelled');
        END IF;
      END
      $$;
    `);

    await queryInterface.createTable('Games', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      pattern: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
        allowNull: false
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      winningNumbers: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true
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

    // Add indexes for Games
    await queryInterface.addIndex('Games', ['status']);
    await queryInterface.addIndex('Games', ['branchId']);
    await queryInterface.addIndex('Games', ['createdBy']);

    // 2. Create GamePlayers table
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_gameplayers_status') THEN
          CREATE TYPE enum_gameplayers_status AS ENUM ('playing', 'won', 'lost');
        END IF;
      END
      $$;
    `);

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

    // Add indexes for GamePlayers
    await queryInterface.addIndex('GamePlayers', ['gameId']);
    await queryInterface.addIndex('GamePlayers', ['userId']);
    await queryInterface.addIndex('GamePlayers', ['cartellaId']);
    await queryInterface.addIndex('GamePlayers', ['status']);

    // 3. Update Users role enum
    // First, change the role column to be a regular string temporarily
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_role;
    `);

    // Create the new enum type with all required values
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_users_role AS ENUM ('superadmin', 'agent', 'user', 'system');
    `);

    // Change the column back to use the new enum type
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('superadmin', 'agent', 'user', 'system'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop GamePlayers table
    await queryInterface.dropTable('GamePlayers');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_gameplayers_status;`);

    // 2. Drop Games table
    await queryInterface.dropTable('Games');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_games_status;`);

    // 3. Revert Users role enum
    // First, change the role column to be a regular string temporarily
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_role;
    `);

    // Create the original enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_users_role AS ENUM ('superadmin', 'agent', 'user');
    `);

    // Change the column back to use the original enum type
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('superadmin', 'agent', 'user'),
      allowNull: false
    });
  }
};
