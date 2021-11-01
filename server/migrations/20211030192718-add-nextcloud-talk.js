module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_user', 'nextcloud_talk_token', {
      allowNull: true,
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {},
};
