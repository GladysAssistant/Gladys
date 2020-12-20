module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "UPDATE t_service SET status='RUNNING' WHERE status='NOT_CONFIGURED' OR status='STOPPED'",
    );
  },
  down: async () => {},
};
