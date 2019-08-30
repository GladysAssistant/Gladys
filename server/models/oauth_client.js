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
      redirect_uri: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
    },
    {},
  );

  return oauthClient;
};
