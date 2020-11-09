module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('t_calendar', 'ctag', {
        type: Sequelize.STRING,
      }),
      queryInterface.addColumn('t_calendar', 'sync_token', {
        type: Sequelize.STRING,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {},
};
