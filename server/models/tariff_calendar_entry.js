// The dated values of the tariff calendars, one row per day or per 30-minute
// interval (docs/specs/energy-contracts.md, section 4).
module.exports = (sequelize, DataTypes) => {
  const tariffCalendarEntry = sequelize.define(
    't_tariff_calendar_entry',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      calendar_key: {
        allowNull: false,
        type: DataTypes.STRING,
        references: {
          model: 't_tariff_calendar',
          key: 'key',
        },
      },
      starts_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      value_string: {
        allowNull: true,
        type: DataTypes.STRING,
        validate: {
          len: [0, 64],
        },
      },
      value_number: {
        allowNull: true,
        type: DataTypes.DECIMAL,
      },
    },
    {
      // Entries are upserted by (calendar_key, starts_at), created_at carries no meaning
      createdAt: false,
    },
  );

  tariffCalendarEntry.associate = (models) => {
    tariffCalendarEntry.belongsTo(models.TariffCalendar, {
      foreignKey: 'calendar_key',
      targetKey: 'key',
      as: 'calendar',
    });
  };

  return tariffCalendarEntry;
};
