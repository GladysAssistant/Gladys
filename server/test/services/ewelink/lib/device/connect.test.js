const Promise = require('bluebird');
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');

const { expect } = chai;
const { assert, fake } = sinon;
const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});

const variable = {
  getValue: (valueId, serviceId) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('password');
    }
    return Promise.resolve(undefined);
  },
};
const event = { emit: fake.returns(null) };
const gladys = {
  event,
  variable,
};
const gladysNotConfigured = {
  event,
  variable: {
    getValue: (valueId) => {
      return Promise.resolve(undefined);
    },
  },
};
const gladysUnvalid = {
  event,
  variable: {
    getValue: (valueId) => {
      if (valueId === 'EWELINK_EMAIL') {
        return Promise.resolve('email@valid.ko');
      }
      if (valueId === 'EWELINK_PASSWORD') {
        return Promise.resolve('');
      }
      return Promise.resolve(undefined);
    },
  },
};

describe('EwelinkHandler connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect', async () => {
    const ewelinkService = EwelinkService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await ewelinkService.device.connect();

    assert.callCount(gladys.event.emit, 1);

    expect(ewelinkService.device.configured).to.equal(true);
    expect(ewelinkService.device.connected).to.equal(true);
    expect(ewelinkService.device.accessToken).to.equal('validAccessToken');
    expect(ewelinkService.device.apiKey).to.equal('validApiKey');
    expect(ewelinkService.device.region).to.equal('eu');
  });
  it('should return not configured error', () => {
    const ewelinkService = EwelinkService(gladysNotConfigured, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const promise = ewelinkService.device.connect();

    chai.assert.isRejected(promise, 'EWeLink is not configured.');
  });
  it('should return connect error', () => {
    const ewelinkService = EwelinkService(gladysUnvalid, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const promise = ewelinkService.device.connect();

    chai.assert.isRejected(promise, 'EWeLink connect error: ');
  });
});
