module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_calendar', 'type', {
      type: Sequelize.STRING,
      defaultValue: null,
    });
    await queryInterface.addColumn('t_calendar_event', 'description', {
      type: Sequelize.STRING,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
