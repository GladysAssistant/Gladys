const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo connect', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should throw an error if netatmo is not configured', async () => {
    try {
      await netatmoHandler.connect();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.message).to.equal('Netatmo is not configured.');
    }
  });

  it('should return auth url and state if netatmo is configured', async () => {
    netatmoHandler.configuration.clientId = 'test-client-id';
    netatmoHandler.configuration.clientSecret = 'test-client-secret';
    netatmoHandler.configuration.scopes = { scopeEnergy: 'scope' };

    const result = await netatmoHandler.connect();
    expect(result).to.have.property('authUrl');
    expect(result).to.have.property('state');
    expect(netatmoHandler.configured).to.equal(true);
  });
});
