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
  init: sinon.fake.resolves(null),
  connect: sinon.fake.resolves(null),
  disconnect: sinon.fake.resolves(null),
  retrieveTokens: sinon.fake.resolves({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expireIn: 10800,
  }),
  setTokens: sinon.fake.resolves(null),
  getStatus: sinon.fake.returns(STATUS.NOT_INITIALIZED),
  saveStatus: sinon.fake.resolves(null),
  getAccessToken: sinon.fake.resolves('mock_access_token'),
  getRefreshToken: sinon.fake.resolves('mock_refresh_token'),
  refreshingTokens: sinon.fake.resolves({
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expireIn: 10800,
  }),
  getConfiguration: sinon.fake.resolves({
    clientId: 'mock_client_id',
    clientSecret: 'mock_client_secret',
    redirectUri: 'mock_redirect_uri',
  }),
  saveConfiguration: sinon.fake.resolves(null),
  discoverDevices: sinon.fake.resolves(discoverDevicesMock),
  loadDevices: sinon.fake.resolves(devicesMock),
  loadDeviceDetails: sinon.fake.resolves(deviceDetailsMock),
  loadThermostatDetails: sinon.fake.resolves(thermostatsDetailsMock),
  pollRefreshingValues: sinon.fake.resolves(null),
  pollRefreshingToken: sinon.fake.resolves(null),
  setValue: sinon.fake.resolves(null),
  updateValues: sinon.fake.resolves(null),
  /* Cameras */
  getImage: sinon.fake.resolves('base64image'),
};

module.exports = {
  NetatmoHandlerMock,
};
