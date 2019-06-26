module.exports = (sequelize, DataTypes) => {
  const script = sequelize.define(
    't_script',
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
      code: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
    },
    {},
  );
  return script;
};
