module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('t_oauth_authorization_code', {
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scope: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      redirect_uri: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {
          model: 't_oauth_client',
          key: 'client_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: {
          model: 't_user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('t_oauth_authorization_code');
  },
};
