const { addSelector } = require('../utils/addSelector');
const { ALARM_MODES_LIST, ALARM_MODES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const house = sequelize.define(
    't_house',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        unique: true,
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
      latitude: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      longitude: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      alarm_mode: {
        allowNull: false,
        type: DataTypes.ENUM(ALARM_MODES_LIST),
        defaultValue: ALARM_MODES.DISARMED,
      },
      alarm_code: {
        allowNull: true,
        type: DataTypes.STRING,
        validate: {
          len: [4, 8],
          isNumeric: true,
        },
      },
      alarm_delay_before_arming: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
    },
    {},
  );

  house.beforeValidate(addSelector);

  house.associate = (models) => {
    house.hasMany(models.Room, {
      foreignKey: 'house_id',
      sourceKey: 'id',
      as: 'rooms',
    });
    // user presence in house
    house.hasMany(models.User, {
      foreignKey: 'current_house_id',
      sourceKey: 'id',
      as: 'users_at_home',
    });
  };

  return house;
};
