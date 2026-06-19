module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_device_feature_supported_option', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      device_feature_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_device_feature',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      label: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      sort_order: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('t_device_feature_supported_option', ['device_feature_id']);
    await queryInterface.addIndex('t_device_feature_supported_option', ['device_feature_id', 'value'], {
      unique: true,
    });
  },
  down: async (queryInterface) => queryInterface.dropTable('t_device_feature_supported_option'),
};
