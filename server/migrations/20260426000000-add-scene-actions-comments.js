module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_scene', 'actions_comments', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },
  down: async () => {},
};
