const sinon = require('sinon').createSandbox();

const MatterBridgeController = require('../../../../services/matter-bridge/api/matterBridge.controller');

describe('MatterBridgeController', () => {
  const status = { enabled: true };
  const bridge = {
    getStatus: sinon.stub().resolves(status),
    getCompatibleDevices: sinon.stub().resolves([{ name: 'Light', selector: 'light', functions: ['light'] }]),
    saveConfig: sinon.stub().resolves(status),
    reset: sinon.stub().resolves(),
  };
  const controller = MatterBridgeController(bridge);
  let res;

  beforeEach(() => {
    sinon.resetHistory();
    res = { json: sinon.stub() };
  });

  it('should get the status', async () => {
    await controller['get /api/v1/service/matter-bridge/status'].controller({}, res);
    sinon.assert.calledOnceWithExactly(res.json, status);
  });

  it('should get the compatible devices', async () => {
    await controller['get /api/v1/service/matter-bridge/device'].controller({}, res);
    sinon.assert.calledOnceWithExactly(res.json, [{ name: 'Light', selector: 'light', functions: ['light'] }]);
  });

  it('should save the settings', async () => {
    const body = { enabled: true, exposureMode: 'all', exposedDevices: [] };
    await controller['post /api/v1/service/matter-bridge/config'].controller({ body }, res);
    sinon.assert.calledOnceWithExactly(bridge.saveConfig, body);
    sinon.assert.calledOnceWithExactly(res.json, status);
  });

  it('should reset the bridge', async () => {
    await controller['post /api/v1/service/matter-bridge/reset'].controller({}, res);
    sinon.assert.calledOnce(bridge.reset);
    sinon.assert.calledOnceWithExactly(res.json, status);
  });
});
