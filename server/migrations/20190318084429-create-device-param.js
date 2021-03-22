module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_device_param', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      device_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_device',
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

    await queryInterface.addIndex('t_device_param', ['device_id']);
    await queryInterface.addIndex('t_device_param', ['device_id', 'name'], {
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_device_param'),
};
