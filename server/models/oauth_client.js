module.exports = (sequelize, DataTypes) => {
  const oauthClient = sequelize.define(
    't_oauth_client',
    {
      client_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      client_secret: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      redirect_uris: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      grants: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {},
  );

  return oauthClient;
};
