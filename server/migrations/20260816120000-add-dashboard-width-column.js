module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'width', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
