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
        type: DataTypes.INTEGER,
        validate: {
          isInt: true,
        },
        // Like last_value / last_value_string on t_device_feature, an option value lives
        // in exactly one of the two columns: `value` for enum-like integer options,
        // `value_string` for dynamic selects (installed TV apps, HDMI sources...) — the
        // integer column then only holds a filler. This getter exposes the one that is
        // set, so every consumer reads a single polymorphic `value`.
        get() {
          const stringValue = this.getDataValue('value_string');
          if (stringValue !== null && stringValue !== undefined) {
            return stringValue;
          }
          return this.getDataValue('value');
        },
      },
      value_string: {
        allowNull: true,
        type: DataTypes.STRING,
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
