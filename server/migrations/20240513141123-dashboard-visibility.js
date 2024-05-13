module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'visibility', {
      type: Sequelize.STRING,
      defaultValue: 'private',
      allowNull: false,
    });
  },
  down: () => {},
};
