module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_session', 'useragent', {
      type: Sequelize.TEXT,
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
