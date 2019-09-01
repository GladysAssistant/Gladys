module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_oauth_access_token',
      [
        {
          id: '0cd30aef-9c4e-4a23-88e3-354797129001',
          access_token: 'oauth_token_1',
          access_token_expires_on: '2019-08-12 07:49:07.556 +00:00',
          refresh_token: 'refresh_token_1',
          refresh_token_expires_on: '2019-08-12 17:49:07.556 +00:00',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: '0cd30aef-9c4e-4a23-88e3-354797129002',
          access_token: 'oauth_token_2',
          access_token_expires_on: '2019-07-12 07:49:07.556 +00:00',
          refresh_token: 'refresh_token_2',
          refresh_token_expires_on: '2019-07-12 17:49:07.556 +00:00',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('t_oauth_access_token', null, {}),
};
