const { addSelectorBeforeValidateHook } = require('../utils/addSelector');

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
      // unique per house (see the t_room_house_id_name index below): two
      // houses can each have a "Living room"
      name: {
        allowNull: false,
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
    {
      indexes: [
        {
          unique: true,
          fields: ['house_id', 'name'],
        },
      ],
    },
  );

  room.beforeValidate(addSelectorBeforeValidateHook);

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
