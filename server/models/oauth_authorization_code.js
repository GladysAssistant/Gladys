module.exports = (sequelize, DataTypes) => {
  const oauthAuthorizationCode = sequelize.define(
    't_oauth_authorization_code',
    {
      code: {
        type: DataTypes.STRING,
      },
      scope: {
        type: DataTypes.STRING,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      redirect_uri: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      client_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 't_oauth_client',
          key: 'client_id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 't_user',
          key: 'id',
        },
      },
    },
    {},
  );
  oauthAuthorizationCode.associate = function(models) {
    oauthAuthorizationCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
      as: 'user',
    });
    oauthAuthorizationCode.belongsTo(models.OAuthClient, {
      foreignKey: 'client_id',
      targetKey: 'client_id',
      as: 'client',
    });
  };
  return oauthAuthorizationCode;
};
