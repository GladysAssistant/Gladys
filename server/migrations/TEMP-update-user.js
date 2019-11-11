module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_user', 'slack_user_id', {
      allowNull: true,
      type: Sequelize.STRING,
    });
  },
  down: (queryInterface) => queryInterface.removeColumn('t_user', 'slack_user_id'),
};
