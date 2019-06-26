const { addSelector } = require('../utils/addSelector');

module.exports = (sequelize, DataTypes) => {
  const house = sequelize.define(
    't_house',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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
      latitude: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      longitude: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
    },
    {},
  );

  house.beforeValidate(addSelector);

  house.associate = (models) => {
    house.hasMany(models.Room, {
      foreignKey: 'house_id',
      sourceKey: 'id',
      as: 'rooms',
    });
  };

  return house;
};
