module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_thermostat_schedule', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
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
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('t_thermostat_schedule_slot', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      schedule_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_thermostat_schedule',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      day_of_week: {
        allowNull: false,
        type: Sequelize.INTEGER,
        // The 0-6 range is enforced by the model and by the Joi schema on write:
        // `validate` is a model-level option and does nothing in createTable.
        comment: '0=Monday, 1=Tuesday, ..., 6=Sunday',
      },
      start_time: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: 'HH:MM format',
      },
      end_time: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: 'HH:MM format',
      },
      preset: {
        allowNull: false,
        type: Sequelize.ENUM('off', 'frost', 'away', 'eco', 'night', 'comfort'),
        comment: 'off, frost, away, eco, night, comfort',
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

    await queryInterface.addIndex('t_thermostat_schedule_slot', ['schedule_id']);
    await queryInterface.addIndex('t_thermostat_schedule_slot', ['day_of_week']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('t_thermostat_schedule_slot');
    await queryInterface.dropTable('t_thermostat_schedule');
  },
};
