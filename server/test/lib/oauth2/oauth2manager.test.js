const { OAuth2Server } = require('oauth2-mock-server');
const { assert } = require('chai');
const { fake } = require('sinon');

const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');

const server = new OAuth2Server();

const serviceId = 'fdsqfds-f46fdqs5f2-f4d5sqf2sd';
const userId = 'fsdqf4d-4896fsd-fsdq454454sd-fsd';
const integrationName = 'test';
const clientId = 'fsdqf4d-4896fsd-fsdq454454sd-fsd';
const secretId = 'fsdqf4d-4896fsd-fsdq454454sd-fsd';

const gladys = {
  variable: {
    getValue: fake.returns(
      '{"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4","expires_in":10800,' +
        '"token_type":"Bearer",' +
        '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
        '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
        '"userid":"33669966",' +
        '"expires_at":"2020-11-13T20:46:50.042Z"}',
    ),
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
    await server.issuer.keys.generateRSA();
    // Start the server
    await server.start(9292, 'localhost');
    logger.debug('Issuer URL:', server.issuer.url);
  });

  after(async function testAfter() {
    await server.stop();
  });

  const manager = new OAuth2Manager(gladys);

  it('oauth manager get executeQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = 'http://localhost:9292/userinfo';
    const queryParams = 'param1=testParam';

    const result = await manager.executeQuery(serviceId, userId, integrationName, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager post executeQuery test ', async () => {
    const queryType = 'post';
    const queryUrl = 'http://localhost:9292/revoke';
    const queryParams = 'param1=testParam';

    logger.debug(manager);
    const result = await manager.executeQuery(serviceId, userId, integrationName, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager get error executeQuery test ', async () => {
    const queryType = 'get';
    const queryUrl = 'http://localhost:9292/revoke';
    const queryParams = 'param1=testParam';

    const result = await manager.executeQuery(serviceId, userId, integrationName, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });

  it('oauth manager get error saveVar test ', async () => {
    const result = await manager.saveVar(clientId, secretId, integrationName, serviceId, userId);
    logger.debug(result);
    return assert.equal(result.success, true);
  });

  it('oauth manager get error deleteVar test ', async () => {
    const result = await manager.deleteVar(integrationName, serviceId, userId);
    logger.debug(result);
    return assert.equal(result.success, true);
  });
});

describe('oauth2manager failled test', () => {
  // check error
  const manager = new OAuth2Manager(null);

  it('oauth manager get error saveVar failled test ', async () => {
    const result = await manager.saveVar(clientId, secretId, integrationName, serviceId, userId);
    logger.debug(result);
    return assert.equal(result.success, false);
  });

  it('oauth manager get error deleteVar failled test ', async () => {
    const result = await manager.deleteVar(integrationName, serviceId, userId);
    logger.debug(result);
    return assert.equal(result.success, false);
  });
});
