'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
