module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_device_feature', {
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
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      external_id: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      category: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      read_only: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      keep_history: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      has_feedback: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      unit: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      min: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      max: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      last_value: {
        type: Sequelize.DOUBLE,
      },
      last_value_string: {
        type: Sequelize.TEXT,
      },
      last_value_changed: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('t_device_feature', ['device_id']);
    await queryInterface.addIndex('t_device_feature', ['category']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_device_feature'),
};
