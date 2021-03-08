module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_location', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      latitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      longitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      altitude: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      accuracy: {
        allowNull: true,
        type: Sequelize.DOUBLE,
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

    await queryInterface.addIndex('t_location', ['user_id']);
    await queryInterface.addIndex('t_location', ['created_at']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_location'),
};
