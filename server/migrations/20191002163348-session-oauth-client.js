module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_session', 'client_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('t_session', 'client_id');
  },
};
