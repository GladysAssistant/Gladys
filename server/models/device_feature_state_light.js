module.exports = (sequelize, DataTypes) => {
  const deviceFeatureStateLight = sequelize.define(
    't_device_feature_state_light',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      device_feature_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_device_feature',
          key: 'id',
        },
      },
      value: {
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
    },
    {
      indexes: [
        {
          name: 'device_feature_id_created_at_index',
          using: 'BTREE',
          fields: ['device_feature_id', 'created_at'],
        },
      ],
    },
  );

  deviceFeatureStateLight.associate = (models) => {
    deviceFeatureStateLight.belongsTo(models.DeviceFeature, {
      foreignKey: 'device_feature_id',
      targetKey: 'id',
      as: 'device_feature',
    });
  };

  return deviceFeatureStateLight;
};
