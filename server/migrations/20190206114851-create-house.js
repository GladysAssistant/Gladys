module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('t_house', {
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
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      longitude: {
        allowNull: true,
        type: Sequelize.DOUBLE,
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
  down: async (queryInterface, Sequelize) => queryInterface.dropTable('t_house'),
};
