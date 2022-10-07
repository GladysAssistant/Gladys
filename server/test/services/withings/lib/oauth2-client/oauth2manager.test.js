const { OAuth2Server } = require('oauth2-mock-server');
const { assert, expect } = require('chai');
const { fake } = require('sinon');

const OAuth2Manager = require('../../../../../services/withings/lib/oauth2-client');
const logger = require('../../../../../utils/logger');
const { OAUTH2 } = require('../../../../../services/withings/lib/oauth2-client/utils/constants.js');
const { BadOauth2ClientResponse } = require('../../../../../services/withings/lib/oauth2-client/utils/coreErrors');

const server = new OAuth2Server();

const testServiceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const testUserId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const testUrl = 'http://localhost:9292';

const gladys = {
  variable: {
    getValue: function getValue(key, serviceId, userId) {
      switch (key) {
        case OAUTH2.VARIABLE.CLIENT_ID:
          return 'fake_client_id';
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
 * Verify componant to implement oauth2manager executeQuery
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
  manager.tokenHost = testUrl;
  manager.authorizeHost = testUrl;
  manager.tokenPath = '/token';
  manager.authorizePath = '/authorize2';
  manager.redirectUriSuffix = '/dashboard/integration/health/test/settings';

  it('oauth manager get buildAuthorizationUri test', async () => {
    const result = await manager.buildAuthorizationUri(testServiceId, 'fakeUserId', 'fake-code', 'fake-referer');

    assert.isNotNull(result);
    assert.equal(
      result,
      'http://localhost:9292/authorize2?response_type=code&client_id=fake_client_id&redirect_uri=fake-referer%2Fdashboard%2Fintegration%2Fhealth%2Ftest%2Fsettings&scope=user.info%2Cuser.metrics%2Cuser.activity%2Cuser.sleepevents&state=gladys_state_fake-code',
    );
  });

  it('oauth manager get getAccessToken test', async () => {
    const result = await manager.getAccessToken(testServiceId, 'fakeUserId', 'fake-code', 'fake-referer');

    assert.isNotNull(result.token);
    assert.isNotNull(result.token.access_token);
    assert.isNotNull(result.token.refresh_token);
    assert.equal(result.token.token_type, 'Bearer');
    assert.equal(result.token.expires_in, 3600);
  });

  it('oauth manager get error  getAccessToken test (BadOauth2ClientResponse)', async () => {
    server.service.once('beforeResponse', (tokenEndpointResponse, req) => {
      tokenEndpointResponse.body.status = 2;
    });
    try {
      await manager.getAccessToken(testServiceId, 'fakeUserId', 'fake-code', 'fake-referer');
      assert.fail('No error BadOauth2ClientResponse happen');
    } catch (e) {
      expect(e).be.instanceOf(BadOauth2ClientResponse);
    }
  });

  it('oauth manager get executeQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/userinfo`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager post executeQuery test ', async () => {
    const queryType = 'post';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    logger.debug(manager);
    const result = await manager.executeQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager get error executeQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });

  it('oauth manager get error executeQuery test (bad integration name) ', async () => {
    const queryType = 'get';
    const queryUrl = `${testUrl}/revoke`;
    const queryParams = 'param1=testParam';

    const result = await manager.executeQuery(testServiceId, 'fakeUserId', queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });

  it('oauth manager getCurrentConfig (without AcessToken) test ', async () => {
    const tmpManager = new OAuth2Manager({
      getValue: function getValue(key, serviceId, userId) {
        switch (key) {
          case OAUTH2.VARIABLE.CLIENT_ID:
            return 'fake_client_id';
          default:
            return null;
        }
      },
      destroy: fake.returns(null),
    });

    const result = await tmpManager.getCurrentConfig(testServiceId, testUserId);
    logger.debug(result);
    return assert.equal(result, null);
  });

  it('oauth manager getCurrentConfig (with AcessToken) test ', async () => {
    const result = await manager.getCurrentConfig(testServiceId, testUserId);
    logger.debug(result);
    return assert.equal(result, 'fake_client_id');
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

    const result = await manager.executeQuery(testServiceId, testUserId, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });
});

describe('oauth2manager buildRedirectUri result test without path', () => {
  const manager = new OAuth2Manager(gladys.variable);

  it('oauth manager buildRedirectUri without path test ', async () => {
    const result = manager.buildRedirectUri('http://localhost:1444', '/path/test');

    return assert.equal(result, 'http://localhost:1444/path/test');
  });
});

describe('oauth2manager buildRedirectUri result test with path', () => {
  const manager = new OAuth2Manager(gladys.variable);

  it('oauth manager buildRedirectUri with path test ', async () => {
    const result = manager.buildRedirectUri('http://localhost:1444/path/test', '/path/test');

    return assert.equal(result, 'http://localhost:1444/path/test');
  });
});

describe('oauth2manager buildRedirectUri result test with ?', () => {
  const manager = new OAuth2Manager(gladys.variable);

  it('oauth manager buildRedirectUri with path test ', async () => {
    const result = manager.buildRedirectUri('http://localhost:1444/path/test?test', '/path/test');

    return assert.equal(result, 'http://localhost:1444/path/test');
  });
});
