module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_service',
      [
        {
          id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          name: 'test-service',
          selector: 'test-service',
          pod_id: null,
          version: '0.1.0',
          status: 'RUNNING',
          has_message_feature: false,
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_service', null, {}),
};
