module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_calendar', 'shared', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
