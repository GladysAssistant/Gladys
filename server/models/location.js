module.exports = (sequelize, DataTypes) => {
  const location = sequelize.define(
    't_location',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      latitude: {
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
      longitude: {
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
      altitude: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      accuracy: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
    },
    {},
  );

  location.associate = (models) => {
    location.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
  };

  return location;
};
