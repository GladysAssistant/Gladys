const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const Zigbee2MqttController = require('../../../../services/zigbee2mqtt/api/zigbee2mqtt.controller');
const { BadParameters, ConflictError } = require('../../../../utils/coreErrors');

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
  energyPrice: {
    getDefaultElectricMeterFeatureId: fake.resolves('default-meter-feature-id'),
  },
};
const zigbee2mqttManager = {
  getDiscoveredDevices: fake.returns(['device']),
  getManagedAdapters: fake.returns(['adapter']),
  getUsbPorts: fake.resolves(['port']),
  status: fake.returns(true),
  getSetup: fake.resolves({ config: 'values' }),
  setup: fake.resolves(true),
  startPrefetch: fake.resolves({ state: 'running', progress: 0, freeBytes: null, neededBytes: 214000000, error: null }),
  init: fake.resolves(true),
  installMqttContainer: fake.resolves(true),
  installZ2mContainer: fake.resolves(true),
  disconnect: fake.returns(true),
  setPermitJoin: fake.returns(true),
  getPermitJoin: fake.returns(true),
  reset: fake.resolves(true),
  refuseWhileInstalling: fake(),
};

describe('zigbee2mqtt API', () => {
  let controller;

  beforeEach(() => {
    controller = Zigbee2MqttController(gladys, zigbee2mqttManager, 'de1dd005-092d-456d-93d1-817c9ace4c67');
    zigbee2mqttManager.refuseWhileInstalling = fake();
    zigbee2mqttManager.getConfiguration = fake.resolves({
      mqttUrl: 'mqtt://localhost:1884',
      mqttPassword: 'gladys-password',
      z2mMqttPassword: 'z2m-password',
    });
    sinon.reset();
  });

  it('get /api/v1/service/zigbee2mqtt/discovered', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/discovered'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.getDiscoveredDevices);
    assert.calledOnce(gladys.energyPrice.getDefaultElectricMeterFeatureId);
    assert.calledWith(res.json, ['device']);
  });

  it('get /api/v1/service/zigbee2mqtt/adapter', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/adapter'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.getManagedAdapters);
    assert.calledWith(res.json, ['adapter']);
  });

  it('get /api/v1/service/zigbee2mqtt/usb/port', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/usb/port'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.getUsbPorts);
    assert.calledWith(res.json, ['port']);
  });

  it('get /api/v1/service/zigbee2mqtt/status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/status'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.status);
    assert.calledWith(res.json, true);
  });

  it('get /api/v1/service/zigbee2mqtt/setup', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/setup'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.getSetup);
    assert.calledOnceWithExactly(res.json, { config: 'values' });
  });

  it('post /api/v1/service/zigbee2mqtt/setup', async () => {
    const req = {
      body: { attr: 'value' },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/setup'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.setup, req.body);
    assert.calledOnceWithExactly(res.json, { config: 'values' });
  });

  it('post /api/v1/service/zigbee2mqtt/prefetch', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/prefetch'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.startPrefetch);
    assert.calledOnceWithExactly(res.json, {
      state: 'running',
      progress: 0,
      freeBytes: null,
      neededBytes: 214000000,
      error: null,
    });
  });

  it('post /api/v1/service/zigbee2mqtt/connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/connect'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, 'connect');
    assert.calledOnce(zigbee2mqttManager.init);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/mqtt/start', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/mqtt/start'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, 'start the MQTT broker');
    assert.calledOnceWithExactly(zigbee2mqttManager.installMqttContainer, {
      mqttUrl: 'mqtt://localhost:1884',
      mqttPassword: 'gladys-password',
      z2mMqttPassword: 'z2m-password',
    });
    assert.calledWith(res.json, { success: true });
  });

  [
    ['the integration was never set up', { mqttPassword: null, z2mMqttPassword: null }],
    ['the account of Zigbee2mqtt is missing', { mqttPassword: 'gladys-password', z2mMqttPassword: null }],
    ['the account of Gladys is missing', { mqttPassword: null, z2mMqttPassword: 'z2m-password' }],
  ].forEach(([label, configuration]) => {
    it(`post /api/v1/service/zigbee2mqtt/mqtt/start should be refused when ${label}`, async () => {
      // PREPARE
      zigbee2mqttManager.getConfiguration = fake.resolves(configuration);
      const res = {
        json: fake.returns(null),
      };
      const next = fake();
      // EXECUTE
      await controller['post /api/v1/service/zigbee2mqtt/mqtt/start'].controller({}, res, next);
      // ASSERT
      // Answered with a 400 by the error middleware, not a 500 on the hash of a missing password
      const [error] = next.firstCall.args;
      expect(error).to.be.instanceOf(BadParameters);
      expect(error.message).to.equal('Zigbee2mqtt: the MQTT accounts do not exist yet, save the setup first');
      assert.notCalled(zigbee2mqttManager.installMqttContainer);
      assert.notCalled(res.json);
    });
  });

  it('post /api/v1/service/zigbee2mqtt/z2m/start', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/z2m/start'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, 'start Zigbee2mqtt');
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/disconnect'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, 'disconnect');
    assert.calledOnce(zigbee2mqttManager.disconnect);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/permit_join', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/permit_join'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.setPermitJoin);
    assert.calledWith(res.json, { success: true });
  });

  it('get /api/v1/service/zigbee2mqtt/permit_join', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/permit_join'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.getPermitJoin);
    assert.calledWith(res.json, true);
  });

  it('post /api/v1/service/zigbee2mqtt/reset', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/reset'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, 'reset');
    assert.calledOnce(zigbee2mqttManager.reset);
    assert.calledWith(res.json, { success: true });
  });

  // An installation or an init in progress would undo them (containers recreated, configuration saved), or run
  // alongside them
  [
    ['connect', 'connect', 'init'],
    ['mqtt/start', 'start the MQTT broker', 'installMqttContainer'],
    ['z2m/start', 'start Zigbee2mqtt', 'installZ2mContainer'],
    ['disconnect', 'disconnect', 'disconnect'],
    ['reset', 'reset', 'reset'],
  ].forEach(([route, action, method]) => {
    it(`post /api/v1/service/zigbee2mqtt/${route} should be refused while an installation or an init runs`, async () => {
      // PREPARE
      const conflict = new ConflictError(`Zigbee2mqtt: cannot ${action} while an installation is running`);
      zigbee2mqttManager.refuseWhileInstalling = fake.throws(conflict);
      const req = {};
      const res = {
        json: fake.returns(null),
      };
      const next = fake();
      // EXECUTE
      await controller[`post /api/v1/service/zigbee2mqtt/${route}`].controller(req, res, next);
      // ASSERT
      assert.calledOnceWithExactly(zigbee2mqttManager.refuseWhileInstalling, action);
      // Answered with a 409 by the error middleware
      assert.calledOnceWithExactly(next, conflict);
      assert.notCalled(zigbee2mqttManager[method]);
      assert.notCalled(res.json);
    });
  });
});
