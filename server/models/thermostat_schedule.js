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
      house_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          len: [1, 40],
        },
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
    thermostatSchedule.belongsTo(models.House, {
      foreignKey: 'house_id',
      targetKey: 'id',
      as: 'house',
    });
    thermostatSchedule.hasMany(models.ThermostatScheduleTransition, {
      foreignKey: 'schedule_id',
      as: 'transitions',
    });
    thermostatSchedule.hasMany(models.ThermostatScheduleDevice, {
      foreignKey: 'schedule_id',
      as: 'thermostats',
    });
  };

  return thermostatSchedule;
};
