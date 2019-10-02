module.exports = (sequelize, DataTypes) => {
  const oauthClient = sequelize.define(
    't_oauth_client',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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
