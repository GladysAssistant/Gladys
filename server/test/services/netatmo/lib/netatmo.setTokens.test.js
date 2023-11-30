const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { GLADYS_VARIABLES } = require('../../../../services/netatmo/lib/utils/netatmo.constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
const tokens = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expireIn: 10800,
  connected: 0,
};

describe('NetatmoHandler.setTokens', () => {
  let setValueStub;
  let netatmoHandler;
  beforeEach(() => {
    sinon.reset();
    netatmoHandler = new NetatmoHandler({}, serviceId);
    setValueStub = sinon.stub();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should throw an error if accessToken is missing', async () => {
    const badTokens = { ...tokens, accessToken: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.equal(false);
  });
  it('should throw an error if refreshToken is missing', async () => {
    const badTokens = { ...tokens, refreshToken: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.equal(false);
  });
  it('should throw an error if expireIn is missing', async () => {
    const badTokens = { ...tokens, expireIn: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.equal(false);
  });
  it('should throw an error if connected is missing', async () => {
    const badTokens = { ...tokens, connected: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.equal(false);
  });
  it('should save tokens successfully', async () => {
    const netatmoHandlerFake = new NetatmoHandler(
      {
        variable: {
          setValue: setValueStub,
        },
      },
      serviceId,
    );
    setValueStub.resolves();
    const result = await netatmoHandlerFake.setTokens(tokens);
    expect(result).to.equal(true);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.ACCESS_TOKEN, 'accessToken', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.REFRESH_TOKEN, 'refreshToken', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.EXPIRE_IN_TOKEN, 10800, serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.CONNECTED, 0, serviceId);
  });
});
