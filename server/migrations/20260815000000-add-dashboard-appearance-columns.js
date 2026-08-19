module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'icon', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
