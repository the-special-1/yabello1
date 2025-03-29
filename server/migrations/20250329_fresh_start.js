'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop all tables if they exist
    await queryInterface.dropAllTables();

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
        type: Sequelize.STRING,
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
      cut: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
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

    // Create Branches table
    await queryInterface.createTable('Branches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
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

    // Create Cartellas table
    await queryInterface.createTable('Cartellas', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      numbers: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Branches',
          key: 'id'
        }
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'available'
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

    // Create Transactions table
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'completed'
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

    // Create Reports table
    await queryInterface.createTable('Reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      numbers: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Branches',
          key: 'id'
        }
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
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

    // Add unique constraints
    await queryInterface.addConstraint('Cartellas', {
      fields: ['id', 'branchId'],
      type: 'unique',
      name: 'cartellas_id_branchId_unique'
    });

    // Create indexes
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Users', ['branchId']);
    await queryInterface.addIndex('Users', ['status']);
    await queryInterface.addIndex('Cartellas', ['branchId']);
    await queryInterface.addIndex('Cartellas', ['status']);
    await queryInterface.addIndex('Transactions', ['senderId']);
    await queryInterface.addIndex('Transactions', ['receiverId']);
    await queryInterface.addIndex('Transactions', ['type']);
    await queryInterface.addIndex('Reports', ['date']);
    await queryInterface.addIndex('Reports', ['branchId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropAllTables();
  }
};
