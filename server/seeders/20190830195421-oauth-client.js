module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_oauth_client',
      [
        {
          id: 'oauth_client_1',
          secret: 'this_is_secret_for_oauth_client_1',
          name: 'OAuth client 1',
          redirect_uris: 'http://oauth1.fr|http://oauth1.com',
          grants: 'authorization_code|grant_2',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'oauth_client_2',
          secret: 'this_is_secret_for_oauth_client_2',
          name: 'OAuth client 2',
          redirect_uris: 'http://oauth2.fr',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_oauth_client', null, {}),
};
