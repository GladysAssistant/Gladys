const { SESSION_TOKEN_TYPES } = require('../utils/constants');

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert(
      't_session',
      [
        {
          id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
          token_hash: 'd3d96a75e6746685699d9be56622a81c8a4cecacd5fbcdcaec9f2458883a3367', // hash of 'refresh-token-test'
          scope: 'dashboard:write',
          revoked: false,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          id: 'baf1fa89-153b-4f2e-adf3-787e410ec291',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
          token_hash: 'd3d96a75e6746685699d9be56622a81c8a4cecacd5fbcdcaec9f2458883a3367', // hash of 'refresh-token-test'
          scope: 'reset-password:write',
          revoked: false,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          // expired resfresh token
          id: '91f656b4-48df-4cd0-89fd-c187c83a0427',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
          token_hash: '9c10364cd85f88a65cb14093333d6e79781c838f48fec0db6c2992ce866c400c', // hash of 'refresh-token-test-expired'
          scope: 'dashboard:write',
          revoked: false,
          valid_until: '2018-02-12 07:49:07.556 +00:00',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          // revoked refresh token
          id: '734a9348-a79b-4a28-b6f9-d194dd1d336a',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
          token_hash: '284252573756a70dc8e198a8a3eec7fa4105a1596399df3a0e860bd922d2dadd', // hash of 'refresh-token-test-revoked'
          scope: 'dashboard:write',
          revoked: true,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          // valid api key
          id: '77e0823e-17cd-42d2-b825-c386f5ce6f23',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.API_KEY,
          token_hash: '47cd528f4164b8ea10cb964d47ba75a5e9671564a625056c0b3d43ca8b66c64e', // hash of 'api-key-test'
          scope: 'dashboard:write',
          revoked: false,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          // expired resfresh token
          id: '59f34250-b7d0-42bd-bb9b-5a24e9009cd4',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.API_KEY,
          token_hash: '1040c73896ed65333bbe91b58b07add87427cdc43f48b64f88727609c97150c0', // hash of 'api-key-test-expired'
          scope: 'dashboard:write',
          revoked: false,
          valid_until: '2018-02-12 07:49:07.556 +00:00',
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
        {
          // revoked refresh token
          id: '37455571-01f4-4aba-ab69-07ce4647c1c4',
          user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          token_type: SESSION_TOKEN_TYPES.API_KEY,
          token_hash: 'cc1cc1d88f532a30dcc26e95423abb746bad5c4ff9ee54be453413f2f6969c10', // hash of 'api-key-test-revoked'
          scope: 'dashboard:write',
          revoked: true,
          valid_until: new Date(new Date().getTime() + 10000000),
          created_at: '2019-02-12 07:49:07.556 +00:00',
          updated_at: '2019-02-12 07:49:07.556 +00:00',
        },
      ],
      {},
    ),

  down: async (queryInterface, Sequelize) => queryInterface.bulkDelete('t_session', null, {}),
};
