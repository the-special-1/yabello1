'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Backup users data
    const users = await queryInterface.sequelize.query(
      'SELECT * FROM "Users"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Drop foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_senderId_fkey";
      ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_receiverId_fkey";
      ALTER TABLE "GamePlayers" DROP CONSTRAINT IF EXISTS "GamePlayers_userId_fkey";
      ALTER TABLE "Games" DROP CONSTRAINT IF EXISTS "Games_createdBy_fkey";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_createdBy_fkey";
    `);

    // Drop existing Users table
    await queryInterface.dropTable('Users');

    // Drop existing enum types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_Users_role CASCADE;
      DROP TYPE IF EXISTS enum_Users_status CASCADE;
    `);

    // Create enum types
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_Users_role AS ENUM ('superadmin', 'agent', 'user');
      CREATE TYPE enum_Users_status AS ENUM ('active', 'inactive');
    `);

    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: 'enum_Users_role',
        allowNull: false
      },
      credits: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      commission: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      status: {
        type: 'enum_Users_status',
        defaultValue: 'active'
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

    // Restore users data
    if (users.length > 0) {
      await queryInterface.bulkInsert('Users', users);
    }

    // Restore foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" 
      ADD CONSTRAINT "Transactions_senderId_fkey" 
      FOREIGN KEY ("senderId") REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;

      ALTER TABLE "Transactions" 
      ADD CONSTRAINT "Transactions_receiverId_fkey" 
      FOREIGN KEY ("receiverId") REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;

      ALTER TABLE "GamePlayers" 
      ADD CONSTRAINT "GamePlayers_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;

      ALTER TABLE "Games" 
      ADD CONSTRAINT "Games_createdBy_fkey" 
      FOREIGN KEY ("createdBy") REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;

      ALTER TABLE "Cartellas" 
      ADD CONSTRAINT "Cartellas_createdBy_fkey" 
      FOREIGN KEY ("createdBy") REFERENCES "Users"(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  },

  async down(queryInterface, Sequelize) {
    // In down migration, we'll just drop everything and let other migrations recreate them
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_senderId_fkey";
      ALTER TABLE "Transactions" DROP CONSTRAINT IF EXISTS "Transactions_receiverId_fkey";
      ALTER TABLE "GamePlayers" DROP CONSTRAINT IF EXISTS "GamePlayers_userId_fkey";
      ALTER TABLE "Games" DROP CONSTRAINT IF EXISTS "Games_createdBy_fkey";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_createdBy_fkey";
    `);

    await queryInterface.dropTable('Users');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_Users_role CASCADE;
      DROP TYPE IF EXISTS enum_Users_status CASCADE;
    `);
  }
};
