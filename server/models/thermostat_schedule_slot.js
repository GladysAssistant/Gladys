const { PRESETS } = require('../utils/thermostatConstants');

module.exports = (sequelize, DataTypes) => {
  const thermostatScheduleSlot = sequelize.define(
    't_thermostat_schedule_slot',
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
      start_time: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      end_time: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      preset: {
        allowNull: false,
        // SQLite has no native ENUM, so the value is checked explicitly:
        // an unknown preset would be stored and then match nothing at
        // regulation time.
        type: DataTypes.ENUM(...PRESETS),
        validate: {
          isIn: [PRESETS],
        },
      },
    },
    {},
  );

  thermostatScheduleSlot.associate = (models) => {
    thermostatScheduleSlot.belongsTo(models.ThermostatSchedule, {
      foreignKey: 'schedule_id',
      as: 'schedule',
    });
  };

  return thermostatScheduleSlot;
};
