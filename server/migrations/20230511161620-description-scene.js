module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_scene', 'description', {
      type: Sequelize.STRING,
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
