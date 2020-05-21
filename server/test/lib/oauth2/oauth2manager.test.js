const { OAuth2Server } = require('oauth2-mock-server');
const { assert } = require('chai');

const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');

const server = new OAuth2Server();

const manager = new OAuth2Manager();

before(async function before() {
  // Generate a new RSA key and add it to the keystore
  server.issuer.keys.generateRSA();
  // Start the server
  await server.start(9292, 'localhost');
  logger.debug('Issuer URL:', server.issuer.url);
});

after(function after() {
  server.stop();
});

/**
 * Verify componant to implement oauth2manager executeQuery
 */
describe('oauth2manager test', () => {
  it('oauth manager get executeQuery test ', async () => {
    const accessToken = 'eyJhbGciOiJIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOlsiZGFzaG';
    const refreshToken = 'dythgbfv78JIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOl892276bvhv';
    const tokenType = 'Bearer';
    const queryType = 'get';
    const queryUrl = 'http://localhost:9292/userinfo';
    const queryParams = 'param1=testParam';

    logger.warn(manager);
    const result = await manager.executeQuery(accessToken, refreshToken, tokenType, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager post executeQuery test ', async () => {
    const accessToken = 'eyJhbGciOiJIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOlsiZGFzaG';
    const refreshToken = 'dythgbfv78JIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOl892276bvhv';
    const tokenType = 'Bearer';
    const queryType = 'post';
    const queryUrl = 'http://localhost:9292/revoke';
    const queryParams = 'param1=testParam';

    logger.warn(manager);
    const result = await manager.executeQuery(accessToken, refreshToken, tokenType, queryType, queryUrl, queryParams);

    return assert.equal(result.status, '200');
  });

  it('oauth manager get error executeQuery test ', async () => {
    const accessToken = 'eyJhbGciOiJIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOlsiZGFzaG';
    const refreshToken = 'dythgbfv78JIUzI1NiIsMtMzU0Nzk3MTI5NmU1Iiwic2NvcGUiOl892276bvhv';
    const tokenType = 'Bearer';
    const queryType = 'get';
    const queryUrl = 'http://localhost:9292/revoke';
    const queryParams = 'param1=testParam';

    logger.warn(manager);
    const result = await manager.executeQuery(accessToken, refreshToken, tokenType, queryType, queryUrl, queryParams);

    return assert.equal(result, null);
  });
});
