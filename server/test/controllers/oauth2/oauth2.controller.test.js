const { expect } = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');

const { buildOauth2Request } = require('./oauth2.request.test');
const logger = require('../../../utils/logger');

const server = new OAuth2Server();


describe('POST /api/v1/service/oauth2/buildAuthorizationUri', () => {

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

  it('should get authorization uri', async () => {
    const req = {
      header: {
        referer: 'fake-referer'
      },
      integrationName: 'test',
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    };

    await buildOauth2Request
      .post('/api/v1/service/oauth2/buildAuthorizationUri')
      .send(req)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('authorizationUri');
      });
  });
});

describe('POST /api/v1/service/oauth2/buildTokenAccessUri', () => {
  it('should get token access uri', async () => {
    const req = {
      integrationName: 'test',
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      authorizationCode: 'fake-code',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    };

    await buildOauth2Request
      .post('/api/v1/service/oauth2/buildTokenAccessUri')
      .send(req)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('result');
      });
  });
});

// failled call
describe('POST /api/v1/service/oauth2/buildTokenAccessUri', () => {
  it('should get token access uri', async () => {
    const req = {
      integrationName: 'test',
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      authorizationCode: 'fake-code', 
    };

    await buildOauth2Request
      .post('/api/v1/service/oauth2/buildTokenAccessUri')
      .send(req)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('result');
      });
  });
});

describe('GET /api/v1/service/oauth2/getCurrentConfig', () => {
  it('should get token access uri', async () => {
    const req = {
      integrationName: 'test',
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    };

    await buildOauth2Request
      .get('/api/v1/service/oauth2/getCurrentConfig')
      .query(req)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('clientId');
      });
  });
});
