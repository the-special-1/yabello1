'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First, remove any foreign key constraints if they exist
      await queryInterface.sequelize.query(`
        ALTER TABLE "Transactions" 
        DROP CONSTRAINT IF EXISTS "Transactions_senderId_fkey",
        DROP CONSTRAINT IF EXISTS "Transactions_receiverId_fkey";
      `);

      // Update any transactions with invalid senderIds to have NULL senderId
      await queryInterface.sequelize.query(`
        UPDATE "Transactions" t
        SET "senderId" = NULL
        WHERE NOT EXISTS (
          SELECT 1 FROM "Users" u WHERE u.id = t."senderId"
        );
      `);

      // Update any transactions with invalid receiverIds to have NULL receiverId
      await queryInterface.sequelize.query(`
        UPDATE "Transactions" t
        SET "receiverId" = NULL
        WHERE "receiverId" IS NOT NULL 
        AND NOT EXISTS (
          SELECT 1 FROM "Users" u WHERE u.id = t."receiverId"
        );
      `);

      // Add back the foreign key constraints with ON DELETE SET NULL
      await queryInterface.sequelize.query(`
        ALTER TABLE "Transactions"
        ADD CONSTRAINT "Transactions_senderId_fkey" 
        FOREIGN KEY ("senderId") 
        REFERENCES "Users"(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE "Transactions"
        ADD CONSTRAINT "Transactions_receiverId_fkey" 
        FOREIGN KEY ("receiverId") 
        REFERENCES "Users"(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "Transactions" 
      DROP CONSTRAINT IF EXISTS "Transactions_senderId_fkey",
      DROP CONSTRAINT IF EXISTS "Transactions_receiverId_fkey";
    `);
  }
};
