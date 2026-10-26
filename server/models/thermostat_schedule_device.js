module.exports = (sequelize, DataTypes) => {
  const thermostatScheduleDevice = sequelize.define(
    't_thermostat_schedule_device',
    {
      // The primary key is the device, not a surrogate id: a thermostat follows
      // at most one schedule, and the database is what enforces it.
      device_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_device',
          key: 'id',
        },
      },
      schedule_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_thermostat_schedule',
          key: 'id',
        },
      },
    },
    {},
  );

  thermostatScheduleDevice.associate = (models) => {
    thermostatScheduleDevice.belongsTo(models.ThermostatSchedule, {
      foreignKey: 'schedule_id',
      as: 'schedule',
    });
    thermostatScheduleDevice.belongsTo(models.Device, {
      foreignKey: 'device_id',
      as: 'device',
    });
  };

  return thermostatScheduleDevice;
};
