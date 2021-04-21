module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_device',
      [
        {
          id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          name: 'Test device',
          selector: 'test-device',
          external_id: 'test-device-external',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'a1ce3d5a-dd7c-4452-9a23-d44ba3d9b072',
          name: 'Test device 2',
          selector: 'test-device-2',
          external_id: 'test-device-2-external',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
          name: 'Test camera',
          selector: 'test-camera',
          external_id: 'test-camera-external',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_device', null, {}),
};
