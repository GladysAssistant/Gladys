const { addSelector } = require('../utils/addSelector');
const { EVENT_LOG_TYPES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const event_log = sequelize.define(
    't_event_log',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      service: {
        allowNull: false,
        type: DataTypes.ENUM(Object.keys(EVENT_LOG_TYPES))
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(Object.values(EVENT_LOG_TYPES).flat())
      },
      sender_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      event_property: {
        allowNull: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  event_log.beforeValidate(addSelector);

  return event_log;
};
