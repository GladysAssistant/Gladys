module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_user', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      firstname: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      lastname: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      birthdate: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      language: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      picture: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      role: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      temperature_unit_preference: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      distance_unit_preference: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      telegram_user_id: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: true,
      },
      last_latitude: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      last_longitude: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      last_altitude: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      last_accuracy: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      last_location_changed: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      current_house_id: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 't_house',
          key: 'id',
        },
      },
      last_house_changed: {
        allowNull: true,
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('t_user', ['role']);
  },
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_user'),
};
