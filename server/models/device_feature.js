const { addSelector } = require('../utils/addSelector');
const {
  DEVICE_FEATURE_CATEGORIES_LIST,
  DEVICE_FEATURE_TYPES_LIST,
  DEVICE_FEATURE_UNITS_LIST,
} = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const deviceFeature = sequelize.define(
    't_device_feature',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      device_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_device',
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
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      category: {
        allowNull: false,
        type: DataTypes.ENUM(DEVICE_FEATURE_CATEGORIES_LIST),
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(DEVICE_FEATURE_TYPES_LIST),
      },
      read_only: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      keep_history: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      has_feedback: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      unit: {
        allowNull: true,
        type: DataTypes.ENUM(DEVICE_FEATURE_UNITS_LIST),
      },
      min: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        validate: {
          isFloat: true,
        },
      },
      max: {
        allowNull: false,
        type: DataTypes.DOUBLE,
        validate: {
          isFloat: true,
        },
      },
      last_value: {
        type: DataTypes.DOUBLE,
        validate: {
          isFloat: true,
        },
      },
      last_value_string: {
        type: DataTypes.TEXT,
      },
      last_value_changed: {
        type: DataTypes.DATE,
      },
      last_hourly_aggregate: {
        type: DataTypes.DATE,
      },
      last_daily_aggregate: {
        type: DataTypes.DATE,
      },
      last_monthly_aggregate: {
        type: DataTypes.DATE,
      },
    },
    {},
  );

  // add slug if needed
  deviceFeature.beforeValidate(addSelector);

  deviceFeature.associate = (models) => {
    deviceFeature.belongsTo(models.Device, {
      foreignKey: 'device_id',
      targetKey: 'id',
      as: 'device',
    });
    deviceFeature.hasMany(models.DeviceFeatureState, {
      foreignKey: 'device_feature_id',
      sourceKey: 'id',
      as: 'device_feature_states',
    });
  };

  return deviceFeature;
};
