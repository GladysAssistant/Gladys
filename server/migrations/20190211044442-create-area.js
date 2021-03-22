module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_area', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      selector: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING,
      },
      latitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      longitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      radius: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      color: {
        allowNull: false,
        type: Sequelize.STRING,
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
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_area'),
};
