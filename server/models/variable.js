const removeSecretValue = (variable) => {
  if (variable && variable.secret) {
    variable.value = null;
  }
  return variable;
};

module.exports = (sequelize, DataTypes) => {
  const variable = sequelize.define(
    't_variable',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      service_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_service',
          key: 'id',
        },
      },
      user_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          isUppercase: true,
        },
      },
      value: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      secret: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
    },
    {},
  );

  variable.associate = (models) => {
    variable.belongsTo(models.Service, {
      foreignKey: 'service_id',
      targetKey: 'id',
      as: 'service',
    });
    variable.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
  };

  // Do not load value for secret variable
  variable.afterCreate(removeSecretValue);
  variable.afterUpdate(removeSecretValue);

  return variable;
};
