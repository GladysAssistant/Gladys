const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { fake } = sinon;

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
const status = {
  configured: false,
  connected: false,
  status: 'not_initialized',
};

describe('NetatmoHandler.getStatus', () => {
  let netatmoHandler;
  beforeEach(() => {
    sinon.reset();
    netatmoHandler = new NetatmoHandler(gladys, serviceId);
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should return current Netatmo status', async () => {
    const result = await netatmoHandler.getStatus();
    expect(result).to.deep.equal(status);
  });
});
