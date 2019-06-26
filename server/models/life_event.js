const { LIFE_EVENT_LIST } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const lifeEvent = sequelize.define(
    't_life_event',
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
      house_id: {
        type: DataTypes.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM(LIFE_EVENT_LIST),
      },
      data: {
        type: DataTypes.JSON,
      },
    },
    {},
  );

  lifeEvent.associate = (models) => {
    lifeEvent.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
    lifeEvent.belongsTo(models.House, {
      foreignKey: 'house_id',
      targetKey: 'id',
      as: 'house',
    });
  };

  return lifeEvent;
};
