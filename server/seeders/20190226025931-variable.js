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
        {
          id: '424544e9-d341-48b3-a4c5-ea3c49b082e1',
          name: 'SMARTTHINGS_CALLBACK_OAUTH',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          value: '{ "callbackAuthentication": { "code": "USER_1" }, "callbackUrls": "URL"}',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '88cf877a-7db9-4d44-b8d9-58c583ec2003',
          name: 'SMARTTHINGS_CALLBACK_OAUTH',
          service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
          user_id: '7a137a56-069e-4996-8816-36558174b727',
          value: '{ "callbackAuthentication": { "code": "USER_2" }, "callbackUrls": "URL"}',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_variable', null, {}),
};
