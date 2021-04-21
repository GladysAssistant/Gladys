module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_variable', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      service_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      value: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('t_variable', ['service_id']);
    await queryInterface.addIndex('t_variable', ['service_id', 'user_id', 'name'], {
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_variable'),
};
