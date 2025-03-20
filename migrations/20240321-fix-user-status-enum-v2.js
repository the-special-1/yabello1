'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First drop the default constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "status" DROP DEFAULT;
    `);

    // Drop the existing enum type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_status CASCADE;
    `);

    // Create the enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_users_status AS ENUM ('active', 'inactive');
    `);

    // Update the column type and set default
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" TYPE enum_users_status 
      USING CASE 
        WHEN "status" = 'active' THEN 'active'::enum_users_status
        ELSE 'inactive'::enum_users_status
      END;
    `);

    // Set the default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" SET DEFAULT 'active'::enum_users_status;
    `);
  },

  async down(queryInterface, Sequelize) {
    // First drop the default
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ALTER COLUMN "status" DROP DEFAULT;
    `);

    // Convert back to varchar
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" TYPE VARCHAR(255) 
      USING "status"::text;
    `);

    // Set the default back
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" SET DEFAULT 'active';
    `);

    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_status;
    `);
  }
};
