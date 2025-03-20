'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First create the enum type
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_status') THEN
          CREATE TYPE "enum_users_status" AS ENUM ('active', 'inactive');
        END IF;
      END
      $$;
    `);

    // Remove the default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    // Then alter the column type
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" TYPE "enum_users_status" 
      USING (
        CASE 
          WHEN status = 'active' THEN 'active'::enum_users_status
          WHEN status = 'inactive' THEN 'inactive'::enum_users_status
          ELSE 'active'::enum_users_status
        END
      );
    `);

    // Finally, set the default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" SET DEFAULT 'active'::enum_users_status;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove default
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    // Convert back to varchar
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" TYPE VARCHAR(255) 
      USING status::text;
    `);

    // Set default back
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "status" SET DEFAULT 'active';
    `);

    // Drop the enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_status";
    `);
  }
};
