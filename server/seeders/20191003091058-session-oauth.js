const { SESSION_TOKEN_TYPES } = require('../utils/constants');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_session',
      [
        {
          id: '52cfd71b-55e8-4c80-93e9-338d101f3d29',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.ACCESS_TOKEN,
          token_hash: '9e6b6d3f6b5828388d612cd17b11e97ed200d07659dec453f0390afa0b8d2795', // hash of 'oauth-access-token'
          scope: 'dashboard:write',
          revoked: false,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
          client_id: 'oauth_client_1',
        },
        {
          id: '1ec7c3d5-f806-4920-97b3-3e75e19b6434',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
          token_hash: 'a2affc908c15a9888be5ddb26833734097fe6871b0b0ab071e59e1c3c4731055', // hash of 'oauth-refresh-token'
          scope: 'reset-password:write',
          revoked: false,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
          client_id: 'oauth_client_1',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) =>
    queryInterface.bulkDelete(
      't_session',
      { id: ['52cfd71b-55e8-4c80-93e9-338d101f3d29', '1ec7c3d5-f806-4920-97b3-3e75e19b6434'] },
      {},
    ),
};
