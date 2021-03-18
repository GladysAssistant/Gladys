module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_device', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      service_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      room_id: {
        type: Sequelize.UUID,
        references: {
          model: 't_room',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      model: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      external_id: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      should_poll: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      poll_frequency: {
        allowNull: true,
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('t_device', ['service_id']);
    await queryInterface.addIndex('t_device', ['room_id']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_device'),
};
