const { TRANSITION_PRESETS } = require('../utils/thermostatConstants');

module.exports = (sequelize, DataTypes) => {
  const thermostatScheduleTransition = sequelize.define(
    't_thermostat_schedule_transition',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      schedule_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_thermostat_schedule',
          key: 'id',
        },
      },
      day_of_week: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
          max: 6,
        },
      },
      // The moment this preset starts applying. It holds until the next
      // transition point, the last point of the week wrapping onto the first.
      time: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          is: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
      },
      preset: {
        allowNull: false,
        // A preset name, or `off` — which is a mode, not a preset, and is
        // applied as a mode write. Checked explicitly because SQLite has no
        // native ENUM: an unknown value would be stored and then match nothing
        // at regulation time.
        type: DataTypes.STRING,
        validate: {
          isIn: [TRANSITION_PRESETS],
        },
      },
    },
    {},
  );

  thermostatScheduleTransition.associate = (models) => {
    thermostatScheduleTransition.belongsTo(models.ThermostatSchedule, {
      foreignKey: 'schedule_id',
      as: 'schedule',
    });
  };

  return thermostatScheduleTransition;
};
