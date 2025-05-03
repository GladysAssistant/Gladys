const sinon = require('sinon');

const devicesMock = require('./netatmo.loadDevices.mock.test.json');
const deviceDetailsMock = require('./netatmo.loadDevicesDetails.mock.test.json');
const thermostatsDetailsMock = require('./netatmo.loadThermostatDetails.mock.test.json');
const discoverDevicesMock = require('./netatmo.discoverDevices.mock.test.json');
const { STATUS, SCOPES } = require('../../../services/netatmo/lib/utils/netatmo.constants');

const NetatmoHandlerMock = {
  serviceId: 'serviceId',
  configuration: {
    clientId: null,
    clientSecret: null,
    scopes: {
      scopeEnergy: `${SCOPES.ENERGY.read} ${SCOPES.ENERGY.write}`,
    },
  },
  configured: false,
  connected: false,
  redirectUri: null,
  accessToken: null,
  refreshToken: null,
  expireInToken: null,
  stateGetAccessToken: null,
  status: STATUS.NOT_INITIALIZED,
  pollRefreshToken: undefined,
  pollRefreshValues: undefined,
  init: sinon.stub().resolves(),
  connect: sinon.stub().resolves(),
  disconnect: sinon.stub().resolves(),
  retrieveTokens: sinon.stub().resolves({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expireIn: 10800,
  }),
  setTokens: sinon.stub().resolves(),
  getStatus: sinon.stub().returns(STATUS.NOT_INITIALIZED),
  saveStatus: sinon.stub().resolves(),
  getAccessToken: sinon.stub().resolves('mock_access_token'),
  getRefreshToken: sinon.stub().resolves('mock_refresh_token'),
  refreshingTokens: sinon.stub().resolves({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expireIn: 10800,
  }),
  getConfiguration: sinon.stub().resolves({
    clientId: 'mock_client_id',
    clientSecret: 'mock_client_secret',
    redirectUri: 'mock_redirect_uri',
  }),
  saveConfiguration: sinon.stub().resolves(),
  discoverDevices: sinon.stub().resolves(discoverDevicesMock),
  loadDevices: sinon.stub().resolves(devicesMock),
  loadDeviceDetails: sinon.stub().resolves(deviceDetailsMock),
  loadThermostatDetails: sinon.stub().resolves(thermostatsDetailsMock),
  pollRefreshingValuess: sinon.stub().resolves(),
  pollRefreshingToken: sinon.stub().resolves(),
  setValue: sinon.stub().resolves(),
  updateValues: sinon.stub().resolves(),
};

module.exports = {
  NetatmoHandlerMock,
};
