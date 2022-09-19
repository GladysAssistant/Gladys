module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This will help dashboard display queries
    await queryInterface.addIndex('t_device_feature_state', ['device_feature_id', 'created_at']);
    await queryInterface.addIndex('t_device_feature_state_aggregate', ['device_feature_id', 'type', 'created_at']);
  },
  down: async () => {},
};
