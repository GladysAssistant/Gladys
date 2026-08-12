const { SERVICE_STATUS, SERVICE_STATUS_LIST, SERVICE_TYPES, SERVICE_TYPES_LIST } = require('../utils/constants');

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
      type: {
        allowNull: false,
        type: DataTypes.ENUM(SERVICE_TYPES_LIST),
        defaultValue: SERVICE_TYPES.INTERNAL,
      },
      docker_image: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      manifest: {
        allowNull: true,
        type: DataTypes.JSON,
      },
      container_id: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      failure_count: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_heartbeat: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      token_version: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      store_slug: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      granted_devices: {
        allowNull: true,
        type: DataTypes.JSON,
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
