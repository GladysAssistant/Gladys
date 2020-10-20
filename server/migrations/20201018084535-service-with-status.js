module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_service', 'status', {
      allowNull: false,
      type: Sequelize.TEXT,
      defaultValue: 'UNKNWON',
      after: 'enabled',
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
