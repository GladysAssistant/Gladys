const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { GLADYS_VARIABLES } = require('../../../../services/netatmo/lib/utils/netatmo.constants');


const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
// const netatmoHandler = new NetatmoHandler({}, serviceId);

const configuration = {
  username: 'username',
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  scopeEnergy: 'read_thermostat write_thermostat'
};

describe('NetatmoHandler.saveConfiguration', () => {
  let setValueStub;
  let netatmoHandler
  beforeEach(() => {
    sinon.reset();
    netatmoHandler = new NetatmoHandler({}, serviceId);
    setValueStub = sinon.stub();
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error if username is missing', async () => {
    const badConfiguration = { ...configuration, username: null };
    const result = await netatmoHandler.saveConfiguration(badConfiguration);
    expect(result).to.be.false;
  });
  it('should throw an error if clientId is missing', async () => {
    const badConfiguration = { ...configuration, clientId: null };
    const result = await netatmoHandler.saveConfiguration(badConfiguration);
    expect(result).to.be.false;
  });
  it('should throw an error if clientSecret is missing', async () => {
    const badConfiguration = { ...configuration, clientSecret: null };
    const result = await netatmoHandler.saveConfiguration(badConfiguration);
    expect(result).to.be.false;
  });
  it('should throw an error if scopeEnergy is missing', async () => {
    const badConfiguration = { ...configuration, scopeEnergy: null };
    const result = await netatmoHandler.saveConfiguration(badConfiguration);
    expect(result).to.be.false;
  });
  it('should save configuration successfully', async () => {
    const netatmoHandler = new NetatmoHandler({
      variable: {
        setValue: setValueStub
      }
    }, serviceId);
    setValueStub.resolves();

    const result = await netatmoHandler.saveConfiguration(configuration);
    expect(result).to.be.true;
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.USERNAME, 'username', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.CLIENT_ID, 'clientId', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.CLIENT_SECRET, 'clientSecret', serviceId);
    sinon.assert.calledWith(setValueStub, GLADYS_VARIABLES.SCOPE_ENERGY, 'read_thermostat write_thermostat', serviceId);
  });
});