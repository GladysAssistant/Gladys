module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new mandatory column
    await queryInterface.addColumn('t_session', 'useragent', {
      type: Sequelize.TEXT,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('t_session', 'useragent');
  },
};
