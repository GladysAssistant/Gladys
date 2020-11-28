module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('t_oauth_client', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      secret: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      redirect_uris: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      grants: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {},
};
