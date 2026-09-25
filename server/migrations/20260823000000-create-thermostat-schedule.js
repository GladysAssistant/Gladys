module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_thermostat_schedule', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      house_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
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
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Two concurrent creates can both pass the duplicate precheck, so the
    // uniqueness has to be enforced by the database as well. It is scoped to the
    // house: two houses may each have a schedule named "Week".
    await queryInterface.addIndex('t_thermostat_schedule', ['house_id', 'name'], {
      unique: true,
      name: 't_thermostat_schedule_house_id_name',
    });

    await queryInterface.createTable('t_thermostat_schedule_transition', {
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
      time: {
        allowNull: false,
        type: Sequelize.STRING,
        comment: 'HH:MM format, the moment this preset starts applying',
      },
      preset: {
        allowNull: false,
        // Stored as a name rather than the THERMOSTAT_PRESET integer, because a
        // transition also accepts `off`, which is a mode and has no place in the
        // preset enum. Not an ENUM column: SQLite does not enforce it anyway, and
        // it would mean a migration every time a preset is added.
        type: Sequelize.STRING,
        comment: 'a THERMOSTAT_PRESET name, or off',
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

    // A schedule is a list of transition points: two points on the same day and
    // the same time would make the programme ambiguous.
    await queryInterface.addIndex('t_thermostat_schedule_transition', ['schedule_id', 'day_of_week', 'time'], {
      unique: true,
      name: 't_thermostat_schedule_transition_schedule_id_day_time',
    });

    // The link between a schedule and the thermostats that follow it. A relation
    // rather than a device param: the primary key on device_id alone is what
    // enforces one schedule per thermostat, and both cascades clean the link up
    // with no code when a schedule or a device is deleted.
    await queryInterface.createTable('t_thermostat_schedule_device', {
      device_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: {
          model: 't_device',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // "Which thermostats follow this schedule?" — the reverse query the device
    // param could not answer.
    await queryInterface.addIndex('t_thermostat_schedule_device', ['schedule_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('t_thermostat_schedule_device');
    await queryInterface.dropTable('t_thermostat_schedule_transition');
    await queryInterface.dropTable('t_thermostat_schedule');
  },
};
