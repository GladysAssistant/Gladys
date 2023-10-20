const { SESSION_TOKEN_TYPE_LIST } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const session = sequelize.define(
    't_session',
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
      token_type: {
        allowNull: false,
        type: DataTypes.ENUM(SESSION_TOKEN_TYPE_LIST),
      },
      scope: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      token_hash: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      valid_until: {
        type: DataTypes.DATE,
      },
      last_seen: {
        type: DataTypes.DATE,
      },
      revoked: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      useragent: {
        type: DataTypes.TEXT,
      },
      tablet_mode: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tablet_mode_locked: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      current_house_id: {
        allowNull: true,
        type: DataTypes.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
      },
    },
    {},
  );

  session.associate = (models) => {
    session.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
    session.belongsTo(models.House, {
      foreignKey: 'current_house_id',
      sourceKey: 'id',
      as: 'current_house',
    });
  };

  return session;
};
