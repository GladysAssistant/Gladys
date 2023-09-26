module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_scene', 'tags', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
