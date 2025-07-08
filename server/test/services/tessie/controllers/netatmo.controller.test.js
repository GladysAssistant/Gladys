const { expect } = require('chai');
const sinon = require('sinon');

const NetatmoController = require('../../../../services/netatmo/api/netatmo.controller');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');

const netatmoController = NetatmoController(NetatmoHandlerMock);

describe('Netatmo Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    sinon.reset();

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };
  });

  describe('getConfiguration', () => {
    it('should get the netatmo configuration', async () => {
      const configuration = { clientId: 'test', clientSecret: 'test', redirectUri: 'test' };
      NetatmoHandlerMock.getConfiguration.resolves(configuration);

      await netatmoController['get /api/v1/service/netatmo/configuration'].controller(req, res);
      expect(res.json.calledWith(configuration)).to.equal(true);
    });
  });

  describe('getStatus', () => {
    it('should get the netatmo status', async () => {
      const status = { connected: true };
      NetatmoHandlerMock.getStatus.resolves(status);

      await netatmoController['get /api/v1/service/netatmo/status'].controller(req, res);
      expect(res.json.calledWith(status)).to.equal(true);
    });
  });

  describe('saveConfiguration', () => {
    it('should save the netatmo configuration', async () => {
      const configuration = { clientId: 'test', clientSecret: 'test', redirectUri: 'test' };
      req.body = configuration;
      NetatmoHandlerMock.saveConfiguration.resolves(true);

      await netatmoController['post /api/v1/service/netatmo/configuration'].controller(req, res);
      expect(res.json.calledWith({ success: true })).to.equal(true);
    });
  });

  describe('saveStatus', () => {
    it('should save the netatmo status', async () => {
      const status = { connected: true };
      req.body = status;
      NetatmoHandlerMock.saveStatus.resolves(true);

      await netatmoController['post /api/v1/service/netatmo/status'].controller(req, res);
      expect(res.json.calledWith({ success: true })).to.equal(true);
    });
  });

  describe('connect', () => {
    it('should connect netatmo', async () => {
      NetatmoHandlerMock.getConfiguration.resolves(true);
      NetatmoHandlerMock.connect.resolves(true);

      await netatmoController['post /api/v1/service/netatmo/connect'].controller(req, res);
      expect(res.json.calledWith(true)).to.equal(true);
    });
  });

  describe('retrieveTokens', () => {
    it('should retrieve netatmo tokens', async () => {
      req.body = { code: 'test-code' };
      NetatmoHandlerMock.retrieveTokens.resolves({ accessToken: 'test-token', refreshToken: 'test-refresh-token' });

      await netatmoController['post /api/v1/service/netatmo/token'].controller(req, res);
      expect(
        res.json.calledWith({
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
        }),
      ).to.equal(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect netatmo', async () => {
      NetatmoHandlerMock.disconnect.resolves();

      await netatmoController['post /api/v1/service/netatmo/disconnect'].controller(req, res);
      expect(res.json.calledWith({ success: true })).to.equal(true);
    });
  });

  describe('discover', () => {
    it('should discover netatmo devices', async () => {
      const devices = [{ id: 'device1' }, { id: 'device2' }];
      NetatmoHandlerMock.discoverDevices.resolves(devices);

      await netatmoController['get /api/v1/service/netatmo/discover'].controller(req, res);
      expect(res.json.calledWith(devices)).to.equal(true);
    });
    it('should return already discovered devices that are not in Gladys', async () => {
      const discoveredDevices = [
        { external_id: 'netatmo:70:ee:50:xx:xx:e0', notInGladys: true },
        { external_id: 'netatmo:70:ee:50:xx:xx:e1', notInGladys: false },
      ];
      NetatmoHandlerMock.discoveredDevices = discoveredDevices;
      NetatmoHandlerMock.gladys = {
        stateManager: {
          get: sinon.stub().callsFake((type, externalId) => {
            const device = discoveredDevices.find((d) => d.external_id === externalId);
            return device && !device.notInGladys ? {} : null;
          }),
        },
      };
      await netatmoController['get /api/v1/service/netatmo/discover'].controller(req, res);

      const expectedDevices = discoveredDevices.filter((d) => d.notInGladys);
      expect(res.json.calledWith(expectedDevices)).to.equal(true);
    });
  });
});
