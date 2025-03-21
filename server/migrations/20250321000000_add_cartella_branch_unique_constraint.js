'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Remove existing constraints
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_pkey";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "cartellas_branch_fk";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "cartellas_user_fk";

      -- Add composite primary key
      ALTER TABLE "Cartellas" ADD CONSTRAINT "Cartellas_pkey" PRIMARY KEY ("id", "branchId");

      -- Add foreign key constraints
      ALTER TABLE "Cartellas" ADD CONSTRAINT "cartellas_branch_fk" 
        FOREIGN KEY ("branchId") REFERENCES "Branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      
      ALTER TABLE "Cartellas" ADD CONSTRAINT "cartellas_user_fk" 
        FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- Add index for better performance
      CREATE INDEX IF NOT EXISTS "cartellas_branch_id_idx" ON "Cartellas"("branchId");
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      -- Remove constraints and index
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "Cartellas_pkey";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "cartellas_branch_fk";
      ALTER TABLE "Cartellas" DROP CONSTRAINT IF EXISTS "cartellas_user_fk";
      DROP INDEX IF EXISTS "cartellas_branch_id_idx";

      -- Restore original primary key
      ALTER TABLE "Cartellas" ADD CONSTRAINT "Cartellas_pkey" PRIMARY KEY ("id");
    `);
  }
};
