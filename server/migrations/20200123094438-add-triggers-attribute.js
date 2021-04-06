module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_scene', 'triggers', {
      type: Sequelize.JSON,
    });
    // delete useless trigger table
    await queryInterface.dropTable('t_trigger');
    // delete useless trigger_scene table
    await queryInterface.dropTable('t_trigger_scene');
  },
  down: async (queryInterface, Sequelize) => {},
};
