module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_service', 'granted_capabilities', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },
  down: async () => {},
};
