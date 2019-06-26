module.exports = (sequelize, DataTypes) => {
  const pod = sequelize.define(
    't_pod',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      room_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_room',
          key: 'id',
        },
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  pod.associate = (models) => {
    pod.belongsTo(models.Room, {
      foreignKey: 'room_id',
      targetKey: 'id',
      as: 'room',
    });
  };

  return pod;
};
