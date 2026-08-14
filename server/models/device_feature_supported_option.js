module.exports = (sequelize, DataTypes) => {
  const deviceFeatureSupportedOption = sequelize.define(
    't_device_feature_supported_option',
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          isNotEmpty(value) {
            if (value === null || value === undefined || `${value}`.trim().length === 0) {
              throw new Error('Validation isNotEmpty on value failed');
            }
          },
        },
        // The column stores every value as a string; integer values (the historical
        // format, still used by enum-like features) are restored as numbers so option
        // values keep matching the numeric feature states they refer to.
        get() {
          const rawValue = this.getDataValue('value');
          if (typeof rawValue === 'string' && /^-?\d+$/.test(rawValue)) {
            const parsedValue = parseInt(rawValue, 10);
            // Only round-trippable integers are restored ('0123' or an id larger than
            // Number.MAX_SAFE_INTEGER stays a string, unchanged)
            if (Number.isSafeInteger(parsedValue) && `${parsedValue}` === rawValue) {
              return parsedValue;
            }
          }
          return rawValue;
        },
      },
      label: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
        },
      },
      sort_order: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {},
  );

  deviceFeatureSupportedOption.associate = (models) => {
    deviceFeatureSupportedOption.belongsTo(models.DeviceFeature, {
      foreignKey: 'device_feature_id',
      targetKey: 'id',
      as: 'device_feature',
    });
  };

  return deviceFeatureSupportedOption;
};
