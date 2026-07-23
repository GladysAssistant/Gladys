const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const {
  BadParameters,
  NotFoundError,
  TooManyRequests,
  ExternalIntegrationUnavailableError,
} = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of a dual-channel integration (the Tuya case): Gladys renders
// the standard "prefer local" toggle
const TEST_TRANSPORTS_MANIFEST = { ...TEST_MANIFEST, transports: ['local', 'cloud'] };

const seedCameraDevice = async (service, stateManager, overrides = {}) => {
  const deviceInDb = await db.Device.create({
    service_id: service.id,
    name: 'Caméra du salon',
    selector: 'ext-test-camera',
    external_id: `ext:${service.selector}:cam`,
  });
  const createdDevice = {
    id: deviceInDb.id,
    service_id: service.id,
    name: 'Caméra du salon',
    selector: 'ext-test-camera',
    external_id: `ext:${service.selector}:cam`,
    features: [
      {
        external_id: `ext:${service.selector}:cam:image`,
        category: 'camera',
        type: 'image',
      },
    ],
    params: [],
    ...overrides,
  };
  stateManager.setState('deviceByExternalId', createdDevice.external_id, createdDevice);
  return createdDevice;
};

describe('externalIntegration.saveCameraImage', () => {
  it('should push the image through the core camera path', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager, device } = buildSupervisor();
    device.camera = { setImage: fake.resolves(null) };
    await seedCameraDevice(service, stateManager);
    const result = await externalIntegration.saveCameraImage(service, {
      device_external_id: `ext:${service.selector}:cam`,
      image: 'image/jpg;base64,/9j/4AAQ',
    });
    expect(result).to.deep.equal({ success: true });
    sinonAssert.calledWith(device.camera.setImage, 'ext-test-camera', 'image/jpg;base64,/9j/4AAQ');
  });

  it('should refuse a malformed publication and an image above the core bound', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const invalidBodies = [
      undefined,
      {},
      { device_external_id: 'ext:x:cam' },
      { device_external_id: '', image: 'x' },
      { device_external_id: 'ext:x:cam', image: `image/jpg;base64,${'a'.repeat(150 * 1024)}` },
    ];
    await Promise.all(
      invalidBodies.map(async (body) => {
        try {
          await externalIntegration.saveCameraImage(service, body);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });

  it('should return 404 for an unknown device or a device of another integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    stateManager.setState('deviceByExternalId', `ext:${service.selector}:foreign-cam`, {
      id: 'foreign',
      service_id: '3edf1747-3892-4a4e-b380-3a10bd536e0f',
      features: [],
    });
    const bodies = [
      { device_external_id: `ext:${service.selector}:unknown`, image: 'image/jpg;base64,x' },
      { device_external_id: `ext:${service.selector}:foreign-cam`, image: 'image/jpg;base64,x' },
    ];
    await Promise.all(
      bodies.map(async (body) => {
        try {
          await externalIntegration.saveCameraImage(service, body);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(NotFoundError);
        }
      }),
    );
  });

  it('should refuse a device without a camera image feature', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    await seedCameraDevice(service, stateManager, {
      features: [{ external_id: `ext:${service.selector}:cam:power`, category: 'switch', type: 'binary' }],
    });
    try {
      await externalIntegration.saveCameraImage(service, {
        device_external_id: `ext:${service.selector}:cam`,
        image: 'image/jpg;base64,x',
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('no camera image feature');
    }
  });

  it('should rate limit to 12 images per minute per device', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager, device } = buildSupervisor();
    device.camera = { setImage: fake.resolves(null) };
    await seedCameraDevice(service, stateManager);
    const body = { device_external_id: `ext:${service.selector}:cam`, image: 'image/jpg;base64,x' };
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 12; i++) {
      // eslint-disable-next-line no-await-in-loop
      await externalIntegration.saveCameraImage(service, body);
    }
    try {
      await externalIntegration.saveCameraImage(service, body);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(TooManyRequests);
    }
  });
});

describe('externalIntegration proxy-service getImage', () => {
  it('should ask the integration for a fresh image with the 15s deadline', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.sendCommand = fake.resolves({ success: true, data: { image: 'image/jpg;base64,/9j/4AAQ' } });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    const image = await proxyService.device.getImage({
      external_id: `ext:${service.selector}:cam`,
      selector: 'ext-test-camera',
      params: [],
    });
    expect(image).to.equal('image/jpg;base64,/9j/4AAQ');
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CAMERA_GET_IMAGE,
      {
        device: { external_id: `ext:${service.selector}:cam`, selector: 'ext-test-camera', params: [] },
      },
      // an ffmpeg capture can be slow: 15s, not the 5s command rule
      { timeoutMs: 15000 },
    );
  });

  it('should throw when the integration answers without a usable image', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.sendCommand = fake.resolves({ success: true });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    try {
      await proxyService.device.getImage({ external_id: 'ext:x:cam', selector: 'cam', params: [] });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_INVALID_CAMERA_IMAGE');
    }
  });
});

describe('externalIntegration.setDeviceTransports', () => {
  const seedTransportDevice = async (service, stateManager) => {
    const deviceInDb = await db.Device.create({
      service_id: service.id,
      name: 'Prise Tuya',
      selector: 'ext-test-plug',
      external_id: `ext:${service.selector}:plug`,
    });
    const createdDevice = {
      id: deviceInDb.id,
      service_id: service.id,
      selector: 'ext-test-plug',
      external_id: `ext:${service.selector}:plug`,
      features: [],
      params: [],
    };
    stateManager.setState('deviceByExternalId', createdDevice.external_id, createdDevice);
    return createdDevice;
  };

  it('should update GLADYS_TRANSPORT and push the badges in real time', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager, event } = buildSupervisor();
    const createdDevice = await seedTransportDevice(service, stateManager);
    const result = await externalIntegration.setDeviceTransports(service, [
      { device_external_id: createdDevice.external_id, transport: 'local' },
      // unknown device: silently ignored, absent from the push
      { device_external_id: `ext:${service.selector}:ghost`, transport: 'cloud' },
    ]);
    expect(result).to.deep.equal({ success: true });
    const paramsInDb = await db.DeviceParam.findAll({ where: { device_id: createdDevice.id }, raw: true });
    expect(paramsInDb).to.have.lengthOf(1);
    expect(paramsInDb[0]).to.include({ name: 'GLADYS_TRANSPORT', value: 'local' });
    expect(createdDevice.params.find((param) => param.name === 'GLADYS_TRANSPORT').value).to.equal('local');
    sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      payload: {
        selector: service.selector,
        transports: [
          { device_external_id: createdDevice.external_id, transport: 'local', degraded: false, message: null },
        ],
      },
    });
  });

  it('should set then clear the degraded transport state', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager, event } = buildSupervisor();
    const createdDevice = await seedTransportDevice(service, stateManager);
    const message = { en: 'Local session refused, falling back to cloud', fr: 'Session locale refusée, bascule cloud' };
    await externalIntegration.setDeviceTransports(service, [
      { device_external_id: createdDevice.external_id, transport: 'cloud', degraded: true, message },
    ]);
    let paramsInDb = await db.DeviceParam.findAll({
      where: { device_id: createdDevice.id },
      raw: true,
      order: [['name', 'ASC']],
    });
    expect(paramsInDb.map((param) => ({ name: param.name, value: param.value }))).to.deep.equal([
      { name: 'GLADYS_TRANSPORT', value: 'cloud' },
      { name: 'GLADYS_TRANSPORT_DEGRADED', value: 'true' },
      { name: 'GLADYS_TRANSPORT_MESSAGE', value: JSON.stringify(message) },
    ]);
    sinonAssert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      payload: {
        selector: service.selector,
        transports: [{ device_external_id: createdDevice.external_id, transport: 'cloud', degraded: true, message }],
      },
    });
    // an entry without degraded clears the degraded params: explicit
    // return to nominal, no phantom orange state
    await externalIntegration.setDeviceTransports(service, [
      { device_external_id: createdDevice.external_id, transport: 'local' },
    ]);
    paramsInDb = await db.DeviceParam.findAll({ where: { device_id: createdDevice.id }, raw: true });
    expect(paramsInDb).to.have.lengthOf(1);
    expect(paramsInDb[0]).to.include({ name: 'GLADYS_TRANSPORT', value: 'local' });
    expect(createdDevice.params).to.have.lengthOf(1);
    expect(createdDevice.params[0]).to.include({ name: 'GLADYS_TRANSPORT', value: 'local' });
  });

  it('should clear a stale reason when a degraded entry has no message', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    const createdDevice = await seedTransportDevice(service, stateManager);
    await externalIntegration.setDeviceTransports(service, [
      { device_external_id: createdDevice.external_id, transport: 'cloud', degraded: true, message: { en: 'Stale' } },
    ]);
    await externalIntegration.setDeviceTransports(service, [
      { device_external_id: createdDevice.external_id, transport: 'cloud', degraded: true },
    ]);
    const paramsInDb = await db.DeviceParam.findAll({
      where: { device_id: createdDevice.id },
      raw: true,
      order: [['name', 'ASC']],
    });
    expect(paramsInDb.map((param) => ({ name: param.name, value: param.value }))).to.deep.equal([
      { name: 'GLADYS_TRANSPORT', value: 'cloud' },
      { name: 'GLADYS_TRANSPORT_DEGRADED', value: 'true' },
    ]);
  });

  it('should refuse malformed degraded entries', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const invalidBatches = [
      [{ device_external_id: 'ext:x:plug', transport: 'cloud', degraded: 'yes' }],
      [{ device_external_id: 'ext:x:plug', transport: 'cloud', degraded: true, message: 'plain string' }],
      // english is required (the front language fallback relies on it)
      [{ device_external_id: 'ext:x:plug', transport: 'cloud', degraded: true, message: { fr: 'Bascule cloud' } }],
      [{ device_external_id: 'ext:x:plug', transport: 'cloud', degraded: true, message: { en: 'x'.repeat(201) } }],
      [{ device_external_id: 'ext:x:plug', transport: 'cloud', degraded: true, message: { en: 'Ok', fr: 42 } }],
    ];
    await Promise.all(
      invalidBatches.map(async (batch) => {
        try {
          await externalIntegration.setDeviceTransports(service, batch);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });

  it('should not push anything when no device matched', async () => {
    const service = await seedExternalService();
    const { externalIntegration, event } = buildSupervisor();
    await externalIntegration.setDeviceTransports(service, [
      { device_external_id: `ext:${service.selector}:ghost`, transport: 'local' },
    ]);
    const transportPushes = event.emit
      .getCalls()
      .filter(
        (call) =>
          call.args[1] && call.args[1].type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      );
    expect(transportPushes).to.have.lengthOf(0);
  });

  it('should refuse malformed batches', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const invalidBatches = [
      undefined,
      [],
      Array(101).fill({ device_external_id: 'ext:x:plug', transport: 'local' }),
      [null],
      [{ transport: 'local' }],
      [{ device_external_id: 'ext:x:plug', transport: 'satellite' }],
    ];
    await Promise.all(
      invalidBatches.map(async (batch) => {
        try {
          await externalIntegration.setDeviceTransports(service, batch);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });
});

describe('externalIntegration reserved GLADYS_* params in discovery', () => {
  const buildDevice = (service, params) => ({
    name: 'Prise Tuya',
    external_id: `ext:${service.selector}:plug`,
    features: [],
    params,
  });

  it('should accept a valid GLADYS_TRANSPORT param', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const count = await externalIntegration.setDiscoveredDevices(service, [
      buildDevice(service, [
        { name: 'ip', value: '192.168.1.42' },
        { name: 'GLADYS_TRANSPORT', value: 'cloud' },
      ]),
    ]);
    expect(count).to.equal(1);
  });

  it('should accept the degraded reserved params', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const count = await externalIntegration.setDiscoveredDevices(service, [
      buildDevice(service, [
        { name: 'GLADYS_TRANSPORT', value: 'cloud' },
        { name: 'GLADYS_TRANSPORT_DEGRADED', value: 'true' },
        { name: 'GLADYS_TRANSPORT_MESSAGE', value: JSON.stringify({ en: 'Local session refused' }) },
      ]),
    ]);
    expect(count).to.equal(1);
  });

  it('should refuse undefined GLADYS_* params and invalid transports', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const invalidParamsLists = [
      [{ name: 'GLADYS_CUSTOM', value: 'x' }],
      [{ name: 'gladys_transport', value: 'local' }],
      [{ name: 'GLADYS_TRANSPORT', value: 'satellite' }],
      // 'true' or absent: a degraded param with another value is a bug
      [{ name: 'GLADYS_TRANSPORT_DEGRADED', value: 'false' }],
      [{ name: 'GLADYS_TRANSPORT_MESSAGE', value: 'not-json' }],
      [{ name: 'GLADYS_TRANSPORT_MESSAGE', value: JSON.stringify({ fr: 'Bascule cloud' }) }],
    ];
    await Promise.all(
      invalidParamsLists.map(async (params) => {
        try {
          await externalIntegration.setDiscoveredDevices(service, [buildDevice(service, params)]);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });
});

describe('externalIntegration GLADYS_PREFER_LOCAL preference', () => {
  it('should default to true for dual-transport integrations', async () => {
    const service = await seedExternalService({ manifest: TEST_TRANSPORTS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    const config = await externalIntegration.getIntegrationConfig(service);
    expect(config.GLADYS_PREFER_LOCAL).to.equal(true);
    const front = await externalIntegration.getConfigForFront(service.selector);
    expect(front.config.GLADYS_PREFER_LOCAL).to.equal(true);
  });

  it('should stay absent without the dual transports declaration', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const config = await externalIntegration.getIntegrationConfig(service);
    expect(config).to.not.have.property('GLADYS_PREFER_LOCAL');
    const front = await externalIntegration.getConfigForFront(service.selector);
    expect(front.config).to.not.have.property('GLADYS_PREFER_LOCAL');
  });

  it('should save the toggle from the front and push it to the integration', async () => {
    const service = await seedExternalService({ manifest: TEST_TRANSPORTS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.sendMessage = fake.returns(true);
    const result = await externalIntegration.saveConfigFromFront(service.selector, { GLADYS_PREFER_LOCAL: false });
    expect(result.config.GLADYS_PREFER_LOCAL).to.equal(false);
    // the integration receives the preference like any config key
    const pushedConfig = externalIntegration.sendMessage.firstCall.args[2].config;
    expect(pushedConfig.GLADYS_PREFER_LOCAL).to.equal(false);
    const config = await externalIntegration.getIntegrationConfig(service);
    expect(config.GLADYS_PREFER_LOCAL).to.equal(false);
  });

  it('should refuse the toggle without dual transports or with a non-boolean value', async () => {
    const dualService = await seedExternalService({
      manifest: TEST_TRANSPORTS_MANIFEST,
      name: 'ext-dev-dual',
      selector: 'ext-dev-dual',
    });
    const simpleService = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.saveConfigFromFront(dualService.selector, { GLADYS_PREFER_LOCAL: 'yes' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('must be a boolean');
    }
    try {
      await externalIntegration.saveConfigFromFront(simpleService.selector, { GLADYS_PREFER_LOCAL: true });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('unknown config key');
    }
  });

  it('should stay read-only for the integration itself', async () => {
    const service = await seedExternalService({ manifest: TEST_TRANSPORTS_MANIFEST });
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.setIntegrationConfig(service, { gladys_prefer_local: false });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('GLADYS_* keys are reserved');
    }
  });
});
