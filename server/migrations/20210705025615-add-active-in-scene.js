module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_scene', 'active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });
  },
  down: async () => {},
};
