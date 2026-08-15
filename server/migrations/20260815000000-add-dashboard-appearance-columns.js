module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_dashboard', 'icon', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('t_dashboard', 'background_image', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('t_dashboard', 'card_style', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async () => {},
};
