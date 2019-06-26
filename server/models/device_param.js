module.exports = (sequelize, DataTypes) => {
  const deviceParam = sequelize.define(
    't_device_param',
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      value: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
    },
    {},
  );

  deviceParam.associate = (models) => {
    deviceParam.belongsTo(models.Device, {
      foreignKey: 'device_id',
      targetKey: 'id',
      as: 'device',
    });
  };

  return deviceParam;
};
