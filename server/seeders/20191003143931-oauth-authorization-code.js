module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_oauth_authorization_code',
      [
        {
          code: 'd71204f44',
          scope: 'dashboard:read',
          expires_at: new Date(new Date().getTime() + 10000000),
          redirect_uri: 'http://oauth1.fr',
          client_id: 'oauth_client_1',
          user_id: '7a137a56-069e-4996-8816-36558174b727',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          code: 'd71204f82',
          scope: 'dashboard:read',
          expires_at: new Date(new Date().getTime() + 10000000),
          redirect_uri: 'http://oauth2.fr',
          client_id: 'oauth_client_2',
          user_id: '7a137a56-069e-4996-8816-36558174b727',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_oauth_authorization_code', null, {}),
};
