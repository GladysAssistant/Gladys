module.exports = (sequelize, DataTypes) => {
  const oauthAccessToken = sequelize.define(
    't_oauth_access_token',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      access_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      access_token_expires_on: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refresh_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refresh_token_expires_on: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
    },
    {},
  );
  oauthAccessToken.associate = function(models) {
    oauthAccessToken.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
  };
  return oauthAccessToken;
};
