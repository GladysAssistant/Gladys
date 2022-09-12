const { addSelector } = require('../utils/addSelector');

module.exports = (sequelize, DataTypes) => {
  const calendar = sequelize.define(
    't_calendar',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      shared: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      service_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_service',
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
      description: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      sync: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notify: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      ctag: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      sync_token: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      color: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      last_sync: {
        type: DataTypes.DATE,
      },
    },
    {},
  );

  calendar.beforeValidate(addSelector);

  calendar.associate = (models) => {
    calendar.hasMany(models.CalendarEvent, {
      foreignKey: 'calendar_id',
      sourceKey: 'id',
      as: 'calendar_events',
    });
  };

  calendar.associate = (models) => {
    calendar.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'creator',
    });
  };

  return calendar;
};
