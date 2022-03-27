const { OAuth2Server } = require('oauth2-mock-server');
const { assert } = require('chai');
const { fake } = require('sinon');

const OAuth2Manager = require('../../../lib/oauth2-client');
const logger = require('../../../utils/logger');
const { OAUTH2 } = require('../../../utils/constants');

const server = new OAuth2Server();

const testServiceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const testUserId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const testUrl = 'http://localhost:9292';

const gladys = {
  variable: {
    getValue: function getValue(key, serviceId, userId) {
      switch (key) {
        case OAUTH2.VARIABLE.TOKEN_HOST:
          return testUrl;
        case OAUTH2.VARIABLE.TOKEN_PATH:
          return '/token';
        case OAUTH2.VARIABLE.AUTHORIZE_HOST:
          return testUrl;
        case OAUTH2.VARIABLE.AUTHORIZE_PATH:
          return '/authorize2';
        case OAUTH2.VARIABLE.INTEGRATION_SCOPE:
          return 'user.info,user.metrics,user.activity,user.sleepevents';
        case OAUTH2.VARIABLE.GRANT_TYPE:
          return 'authorization_code';
        case OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX:
          return '/dashboard/integration/health/test/settings';
        case OAUTH2.VARIABLE.ACCESS_TOKEN:
          return (
            '{"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4","expires_in":10800,' +
            '"token_type":"Bearer",' +
            '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
            '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
            '"userid":"33669966",' +
            '"expires_at":"2020-11-13T20:46:50.042Z"}'
          );
        default:
          return '';
      }
    },
    setValue: fake.returns(null),
    destroy: fake.returns(null),
  },
};

/**
 * Verify componant to implement oauth2manager executeOauth2HTTPQuery
 */
describe('oauth2manager test', () => {
  before(async function testBefore() {
    // Generate a new RSA key and add it to the keystore
    await server.issuer.keys.generate('RS256');
    // Start the server
    await server.start(9292, 'localhost');
    logger.debug('Issuer URL:', server.issuer.url);
  });

  after(async function testAfter() {
    await server.stop();
  });

  const manager = new OAuth2Manager(gladys.variable);

  it('oauth manager get executeOauth2HTTPQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/userinfo`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeOauth2HTTPQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager post executeOauth2HTTPQuery test ', async () => {
    const queryType = 'post';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    logger.debug(manager);
    const result = await manager.executeOauth2HTTPQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager get error executeOauth2HTTPQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeOauth2HTTPQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });

  it('oauth manager get error executeOauth2HTTPQuery test (bad integration name) ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeOauth2HTTPQuery(testServiceId, 'fakeUserId', queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });

  it('oauth manager  deleteClient test ', async () => {
    const result = await manager.deleteClient(testServiceId, testUserId);
    logger.debug(result);
    return assert.equal(result.success, true);
  });
});

describe('oauth2manager failled test', () => {
  // check error
  const manager = new OAuth2Manager(gladys.variable);

  it('oauth manager get error on refresh token test ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/userinfo`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeOauth2HTTPQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });
});
