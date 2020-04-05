module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_device_param',
      [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '10',
          secret: false,
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '87470fcb-9279-45f4-a59c-f7e6db1c1830',
          name: 'TEST_SECRET_PARAM',
          value: 'a_secret_value',
          secret: true,
          device_id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
          created_at: '2020-02-12 07:49:07.556 +00:00',
          updated_at: '2020-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_device_param', null, {}),
};
