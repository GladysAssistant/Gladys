module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('t_scene', 'active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      }),
    ]);
  },
  down: async () => {},
};
