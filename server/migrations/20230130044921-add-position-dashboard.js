module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'position', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
