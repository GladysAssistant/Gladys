const { SERVICE_STATUS, SERVICE_STATUS_LIST } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const service = sequelize.define(
    't_service',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      pod_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_pod',
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
      version: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      has_message_feature: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM(SERVICE_STATUS_LIST),
        defaultValue: SERVICE_STATUS.UNKNOWN,
      },
    },
    {},
  );

  service.associate = (models) => {
    service.belongsTo(models.Pod, {
      foreignKey: 'pod_id',
      targetKey: 'id',
      as: 'pod',
    });
    service.hasMany(models.Device, {
      foreignKey: 'service_id',
      sourceKey: 'id',
      as: 'devices',
    });
  };

  return service;
};
