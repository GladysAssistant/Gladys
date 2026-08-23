const { slugify } = require('../utils/slugify');

module.exports = (sequelize, DataTypes) => {
  const thermostatSchedule = sequelize.define(
    't_thermostat_schedule',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  thermostatSchedule.beforeValidate((item) => {
    if (item.isNewRecord && !item.selector) {
      item.selector = slugify(`${item.name}-${Date.now()}`, true);
    }
  });

  thermostatSchedule.associate = (models) => {
    thermostatSchedule.hasMany(models.ThermostatScheduleSlot, {
      foreignKey: 'schedule_id',
      as: 'slots',
    });
  };

  return thermostatSchedule;
};
