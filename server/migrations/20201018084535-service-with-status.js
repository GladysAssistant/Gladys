module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new mandatory column
    await queryInterface.addColumn('t_service', 'status', {
      allowNull: false,
      type: Sequelize.TEXT,
      defaultValue: 'UNKNWON',
      after: 'enabled',
    });
    await queryInterface.removeColumn('t_service', 'enabled');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_service', 'enabled', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      after: 'status',
    });
    await queryInterface.removeColumn('t_service', 'status');
  },
};
