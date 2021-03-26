module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_variable',
      [
        {
          id: '1077f8da-2d7c-4ea0-b414-df9bbc86d193',
          name: 'SECURE_VARIABLE',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          user_id: null,
          value: 'VALUE',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'ee654d06-61ee-44ca-b12b-3b91b6340647',
          name: 'GLADYS_GATEWAY_RSA_PUBLIC_KEY',
          service_id: null,
          value: 'VALUE',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '0e644a2e-d80b-4347-9886-c6a482a66143',
          name: 'GLADYS_GATEWAY_ECDSA_PUBLIC_KEY',
          service_id: null,
          value: 'VALUE',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '0930c1ac-0f5d-4a65-8ef4-ea92ebdd36b6',
          name: 'USER_SECURE_VARIABLE',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          value: 'USER_VALUE',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_variable', null, {}),
};
