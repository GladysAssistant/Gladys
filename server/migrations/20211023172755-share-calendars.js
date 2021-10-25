module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_calendar', 'shared_users', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
