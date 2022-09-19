const { addSelector } = require('../utils/addSelector');

module.exports = (sequelize, DataTypes) => {
  const calendarEvent = sequelize.define(
    't_calendar_event',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      calendar_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_calendar',
          key: 'id',
        },
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
      external_id: {
        unique: true,
        type: DataTypes.STRING,
      },
      url: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
      description: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      start: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      end: {
        type: DataTypes.DATE,
      },
      full_day: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {},
  );

  calendarEvent.beforeValidate(addSelector);

  calendarEvent.associate = (models) => {
    calendarEvent.belongsTo(models.Calendar, {
      foreignKey: 'calendar_id',
      targetKey: 'id',
      as: 'calendar',
    });
  };

  return calendarEvent;
};
