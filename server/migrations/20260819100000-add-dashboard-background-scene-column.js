module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'background_scene', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
