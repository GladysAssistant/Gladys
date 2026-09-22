const { TARIFF_CALENDAR_GRANULARITIES, TARIFF_CALENDAR_GRANULARITIES_LIST } = require('../utils/constants');

// The durable declaration of a tariff calendar: one row per key across the
// instance, kept whatever happens to its provider (docs/specs/energy-contracts.md, section 4).
module.exports = (sequelize, DataTypes) => {
  const tariffCalendar = sequelize.define(
    't_tariff_calendar',
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        validate: {
          is: /^[a-z0-9][a-z0-9-]{0,63}$/,
        },
      },
      provider_service_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
      },
      granularity: {
        allowNull: false,
        type: DataTypes.ENUM(TARIFF_CALENDAR_GRANULARITIES_LIST),
        defaultValue: TARIFF_CALENDAR_GRANULARITIES.DAY,
      },
      timezone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      day_starts_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: '00:00',
      },
      values: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      currency: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      first_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      last_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {},
  );

  tariffCalendar.associate = (models) => {
    tariffCalendar.belongsTo(models.Service, {
      foreignKey: 'provider_service_id',
      targetKey: 'id',
      as: 'provider_service',
    });
    tariffCalendar.hasMany(models.TariffCalendarEntry, {
      foreignKey: 'calendar_key',
      sourceKey: 'key',
      as: 'entries',
    });
  };

  return tariffCalendar;
};
