module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('t_oauth_client', {
      client_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      client_secret: {
        type: Sequelize.STRING,
      },
      redirect_uris: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => queryInterface.dropTable('t_oauth_client'),
};
