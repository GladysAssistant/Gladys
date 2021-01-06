module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("UPDATE t_service SET status='UNKNOWN' WHERE status='UNKNWON'");
    await queryInterface.sequelize.query("UPDATE t_service SET status='RUNNING' WHERE status='READY'");
  },
  down: async (queryInterface, Sequelize) => {},
};
