module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_device_param',
      [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '10',
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        // Kodi device params
        {
          id: '3c222e91-d991-4dd1-bacf-9369a88c897e',
          device_id: '99dc1ca1-ed80-46c7-b330-c0d57383640b',
          name: 'default',
          value: 'true',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '5a9353ca-e719-439e-a1b5-0ee1dfb4f34b',
          device_id: '99dc1ca1-ed80-46c7-b330-c0d57383640b',
          name: 'host',
          value: 'localhost',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'b107c97b-d55a-4125-9796-08d561c57d36',
          device_id: '99dc1ca1-ed80-46c7-b330-c0d57383640b',
          name: 'port',
          value: '9090',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_device_param', null, {}),
};
