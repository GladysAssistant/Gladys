module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('t_calendar_event', 'name', {
      allowNull: false,
      type: Sequelize.STRING,
      unique: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('t_calendar_event', 'name', {
      allowNull: false,
      type: Sequelize.STRING,
      unique: true,
    });
  },
};
