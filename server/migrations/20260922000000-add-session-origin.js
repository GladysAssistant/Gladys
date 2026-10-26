// Origin (scheme + host + port) the browser was on when the session was
// opened. The forgot-password flow only builds a reset link for an origin
// already seen on an authenticated session of the instance, so a reset link
// can never point to a host the instance's users have never used.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_session', 'origin', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async () => {},
};
