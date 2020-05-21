const { expect } = require('chai');
const { OAuth2Server } = require('oauth2-mock-server');
// const sinon = require('sinon');
// const { assert, expect } = require('chai');

const { buildOauth2Request } = require('./oauth2.request.test');

// const { fake } = sinon;

// const Gladys = require('../../../lib');
// const OAuth2Controller = require('../../../api/controllers/oauth2.controller');
// const express = require('express');
// const { expect } = require('chai');
const logger = require('../../../utils/logger');

const server = new OAuth2Server();

before(async function before() {
  // Generate a new RSA key and add it to the keystore
  server.issuer.keys.generateRSA();
  // Start the server
  await server.start(9191, 'localhost');
  logger.debug('Issuer URL:', server.issuer.url);
});

after(async function after() {
  await server.stop();
});

describe('POST /api/v1/service/oauth2/buildAuthorizationUri', () => {
  it('should get authorization uri', async () => {
    const req = {
      integrationName: 'test',
      clientId: 'fake-cient_id',
      secretId: 'facke_secret_id',
      serviceId: 'a810b8db-6d04-4697-bed3-c4b72c996279',
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
