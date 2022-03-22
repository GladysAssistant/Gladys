const { DEVICE_FEATURE_STATE_AGGREGATE_TYPES_LIST } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const deviceFeatureState = sequelize.define(
    't_device_feature_state_aggregate',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(DEVICE_FEATURE_STATE_AGGREGATE_TYPES_LIST),
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
        validate: {
          isFloat: true,
        },
      },
    },
    {},
  );

  deviceFeatureState.associate = (models) => {
    deviceFeatureState.belongsTo(models.DeviceFeature, {
      foreignKey: 'device_feature_id',
      targetKey: 'id',
      as: 'device_feature',
    });
  };

  return deviceFeatureState;
};
