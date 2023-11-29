const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { GLADYS_VARIABLES } = require('../../../../services/netatmo/lib/utils/netatmo.constants');


const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
const netatmoHandler = new NetatmoHandler({}, serviceId);

const tokens = {
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  expire_in: 10800,
  connected: 0
};

describe('NetatmoHandler.setTokens', () => {
  let setValueStub;

  beforeEach(() => {
    setValueStub = sinon.stub();
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error if access_token is missing', async () => {
    const badTokens = { ...tokens, access_token: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.be.false;
  });
  it('should throw an error if refresh_token is missing', async () => {
    const badTokens = { ...tokens, refresh_token: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.be.false;
  });
  it('should throw an error if expire_in is missing', async () => {
    const badTokens = { ...tokens, expire_in: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.be.false;
  });
  it('should throw an error if connected is missing', async () => {
    const badTokens = { ...tokens, connected: null };
    const result = await netatmoHandler.setTokens(badTokens);
    expect(result).to.be.false;
  });
  it('should save tokens successfully', async () => {
    const netatmoHandler = new NetatmoHandler({
      variable: {
        setValue: setValueStub
      }
    }, serviceId);
    setValueStub.resolves();

    const result = await netatmoHandler.setTokens(tokens);
    expect(result).to.be.true;
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.ACCESS_TOKEN, 'access_token', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.REFRESH_TOKEN, 'refresh_token', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.EXPIRE_IN_TOKEN, 10800, serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.CONNECTED, 0, serviceId);
  });
});