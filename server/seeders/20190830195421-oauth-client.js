module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_oauth_client',
      [
        {
          client_id: 'oauth_client_1',
          client_secret: 'this_is_secret_for_oauth_client_1',
          redirect_uris: 'http://oauth1.fr|http://oauth1.com',
          grants: 'grant_1|grant_2',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          client_id: 'oauth_client_2',
          client_secret: 'this_is_secret_for_oauth_client_2',
          redirect_uris: 'http://oauth2.fr',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_oauth_client', null, {}),
};
