const { addSelector } = require('../utils/addSelector');

module.exports = (sequelize, DataTypes) => {
  const room = sequelize.define(
    't_room',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      house_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
      },
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
        validate: {
          len: [1, 40],
        },
      },
      selector: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  room.beforeValidate(addSelector);

  room.associate = (models) => {
    room.belongsTo(models.House, {
      foreignKey: 'house_id',
      targetKey: 'id',
      as: 'house',
    });
    room.hasMany(models.Device, {
      foreignKey: 'room_id',
      sourceKey: 'id',
      as: 'devices',
    });
  };

  return room;
};
