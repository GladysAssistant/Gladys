const { addSelector } = require('../utils/addSelector');
const { DEVICE_POLL_FREQUENCIES_LIST } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const device = sequelize.define(
    't_device',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      service_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
      },
      room_id: {
        type: DataTypes.UUID,
        references: {
          model: 't_room',
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
      model: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      external_id: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      should_poll: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      poll_frequency: {
        allowNull: true,
        type: DataTypes.ENUM(DEVICE_POLL_FREQUENCIES_LIST),
      },
    },
    {},
  );

  // add slug if needed
  device.beforeValidate(addSelector);

  device.associate = (models) => {
    device.belongsTo(models.Room, {
      foreignKey: 'room_id',
      targetKey: 'id',
      as: 'room',
    });
    device.belongsTo(models.Service, {
      foreignKey: 'service_id',
      targetKey: 'id',
      as: 'service',
    });
    device.hasMany(models.DeviceFeature, {
      foreignKey: 'device_id',
      sourceKey: 'id',
      as: 'features',
    });
    device.hasMany(models.DeviceParam, {
      foreignKey: 'device_id',
      sourceKey: 'id',
      as: 'params',
    });
  };

  return device;
};
