const { addSelector } = require('../utils/addSelector');

module.exports = (sequelize, DataTypes) => {
  const area = sequelize.define(
    't_area',
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
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
      longitude: {
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
      radius: {
        allowNull: false,
        type: DataTypes.DOUBLE,
      },
      color: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {},
  );

  area.beforeValidate(addSelector);

  return area;
};
