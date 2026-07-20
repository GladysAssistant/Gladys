const EventEmitter = require('events');
const { expect } = require('chai');
const WebSocket = require('ws');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { SERVICE_STATUS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest declaring two on-demand actions (the Tuya protocol detection
// case), one with a form and a long timeout, one bare
const TEST_ACTIONS_MANIFEST = {
  ...TEST_MANIFEST,
  actions: [
    {
      key: 'detect_protocol',
      label: { en: 'Detect protocol version', fr: 'Détecter la version de protocole' },
      description: { en: 'Tries each protocol version against the device.' },
      timeout_seconds: 15,
      fields: [
        { key: 'ip', type: 'string', label: { en: 'Device IP' }, required: true, placeholder: { en: '192.168.1.42' } },
        { key: 'deep_scan', type: 'boolean', label: { en: 'Deep scan' } },
      ],
    },
    {
      key: 'test_connection',
      label: { en: 'Test connection' },
    },
  ],
};

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

const seedActionsService = (overrides = {}) => seedExternalService({ manifest: TEST_ACTIONS_MANIFEST, ...overrides });

describe('externalIntegration.runAction', () => {
  it('should validate the form, relay with the per-action timeout and return the message', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    externalIntegration.sendCommand = fake.resolves({
      success: true,
      data: { message: { en: 'Protocol 3.3 detected', fr: 'Protocole 3.3 détecté' } },
    });
    const result = await externalIntegration.runAction(service.selector, 'detect_protocol', {
      ip: '192.168.1.42',
      deep_scan: true,
    });
    expect(result).to.deep.equal({
      success: true,
      message: { en: 'Protocol 3.3 detected', fr: 'Protocole 3.3 détecté' },
    });
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ACTION_RUN,
      { key: 'detect_protocol', fields: { ip: '192.168.1.42', deep_scan: true } },
      // the declared timeout of the action, NOT the 5s command rule
      { timeoutMs: 15000 },
    );
  });

  it('should use the default 30s timeout and a null message when the action declares none', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const result = await externalIntegration.runAction(service.selector, 'test_connection');
    expect(result).to.deep.equal({ success: true, message: null });
    expect(externalIntegration.sendCommand.firstCall.args[3]).to.deep.equal({ timeoutMs: 30000 });
  });

  it('should return 404 on an action key not declared in the manifest', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.runAction(service.selector, 'reboot_the_world');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.include('not declared in the manifest');
    }
  });

  it('should refuse invalid form values', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    const invalidCalls = [
      // unknown field
      { unknown_field: 'x', ip: '192.168.1.42' },
      // wrong type against the field definition
      { ip: 42 },
      // required field missing
      { deep_scan: true },
    ];
    await Promise.all(
      invalidCalls.map(async (fields) => {
        try {
          await externalIntegration.runAction(service.selector, 'detect_protocol', fields);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(Error422);
        }
      }),
    );
    try {
      await externalIntegration.runAction(service.selector, 'detect_protocol', 'not-an-object');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }
  });

  it('should turn an explicit failure of the integration into a 422 with its message', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    const resultPromise = externalIntegration.runAction(service.selector, 'test_connection');
    for (let i = 0; i < 20 && !ws.send.called; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.resolve();
    }
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ACTION_RUN);
    externalIntegration.handleCommandResult(service, {
      message_id: sentMessage.payload.message_id,
      success: false,
      error: 'device unreachable',
    });
    try {
      await resultPromise;
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('device unreachable');
    }
  });

  it('should keep a disconnected integration as a transport error, not a 422', async () => {
    const service = await seedActionsService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.runAction(service.selector, 'test_connection');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_NOT_CONNECTED');
    }
  });
});

describe('externalIntegration params upsert on re-publish', () => {
  const seedCreatedDevice = async (service, stateManager) => {
    const deviceInDb = await db.Device.create({
      service_id: service.id,
      name: 'Ma prise Tuya',
      selector: 'ext-test-plug',
      external_id: `ext:${service.selector}:plug-1`,
    });
    const ipParam = await db.DeviceParam.create({ device_id: deviceInDb.id, name: 'ip', value: '192.168.1.10' });
    const createdDevice = {
      id: deviceInDb.id,
      service_id: service.id,
      name: 'Ma prise Tuya',
      selector: 'ext-test-plug',
      external_id: `ext:${service.selector}:plug-1`,
      features: [],
      params: [{ id: ipParam.id, name: 'ip', value: '192.168.1.10' }],
    };
    stateManager.setState('deviceByExternalId', createdDevice.external_id, createdDevice);
    return createdDevice;
  };

  const buildPublishedDevice = (service, params) => ({
    name: 'Prise Tuya renommée par le dev',
    external_id: `ext:${service.selector}:plug-1`,
    features: [],
    params,
  });

  it('should silently upsert the params of an already-created device', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.sendMessage = fake.returns(true);
    const createdDevice = await seedCreatedDevice(service, stateManager);
    await externalIntegration.setDiscoveredDevices(service, [
      buildPublishedDevice(service, [
        // DHCP renewed the IP, and a local_key appeared after a scan
        { name: 'ip', value: '192.168.1.42' },
        { name: 'local_key', value: 'abcd' },
      ]),
    ]);
    const paramsInDb = await db.DeviceParam.findAll({
      where: { device_id: createdDevice.id },
      order: [['name', 'ASC']],
      raw: true,
    });
    expect(paramsInDb.map(({ name, value }) => ({ name, value }))).to.deep.equal([
      { name: 'ip', value: '192.168.1.42' },
      { name: 'local_key', value: 'abcd' },
    ]);
    // the in-memory device now carries the new params (poll/setValue use them)
    expect(createdDevice.params.find((param) => param.name === 'ip').value).to.equal('192.168.1.42');
    expect(createdDevice.params.find((param) => param.name === 'local_key').value).to.equal('abcd');
    // the name stays the property of the user, and there is no
    // device-updated echo back to the integration (it would loop)
    const deviceInDb = await db.Device.findOne({ where: { id: createdDevice.id } });
    expect(deviceInDb.name).to.equal('Ma prise Tuya');
    sinonAssert.notCalled(externalIntegration.sendMessage);
  });

  it('should not touch anything when the re-published params are identical', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    const createdDevice = await seedCreatedDevice(service, stateManager);
    externalIntegration.upsertDeviceParams = fake.resolves(null);
    await externalIntegration.setDiscoveredDevices(service, [
      buildPublishedDevice(service, [{ name: 'ip', value: '192.168.1.10' }]),
    ]);
    // upsert called with the device, but a real call would change nothing
    sinonAssert.calledOnce(externalIntegration.upsertDeviceParams);
    delete externalIntegration.upsertDeviceParams;
    await externalIntegration.upsertDeviceParams(createdDevice, [{ name: 'ip', value: '192.168.1.10' }]);
    const paramsInDb = await db.DeviceParam.findAll({ where: { device_id: createdDevice.id }, raw: true });
    expect(paramsInDb).to.have.lengthOf(1);
    expect(paramsInDb[0].value).to.equal('192.168.1.10');
  });

  it('should ignore devices created by another integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.upsertDeviceParams = fake.resolves(null);
    stateManager.setState('deviceByExternalId', `ext:${service.selector}:plug-1`, {
      id: 'other-device',
      service_id: 'ecc58a07-757e-4b08-89ac-af4d18e694b5',
      features: [],
      params: [],
    });
    await externalIntegration.setDiscoveredDevices(service, [buildPublishedDevice(service, [])]);
    sinonAssert.notCalled(externalIntegration.upsertDeviceParams);
  });

  it('should flag a re-published structure change for the Discovery screen', async () => {
    const service = await seedExternalService();
    const { externalIntegration, stateManager } = buildSupervisor();
    const createdDevice = await seedCreatedDevice(service, stateManager);
    createdDevice.features = [
      { external_id: `ext:${service.selector}:plug-1:power`, category: 'switch', type: 'binary' },
    ];
    // same structure -> no update proposed
    await externalIntegration.setDiscoveredDevices(service, [
      {
        ...buildPublishedDevice(service, []),
        features: [{ external_id: `ext:${service.selector}:plug-1:power`, category: 'switch', type: 'binary' }],
      },
    ]);
    let devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.include({ created: true, structure_changed: false });
    // a feature appeared -> the Discovery screen offers "Update"
    await externalIntegration.setDiscoveredDevices(service, [
      {
        ...buildPublishedDevice(service, []),
        features: [
          { external_id: `ext:${service.selector}:plug-1:power`, category: 'switch', type: 'binary' },
          {
            external_id: `ext:${service.selector}:plug-1:energy`,
            category: 'energy-sensor',
            type: 'power',
            unit: 'watt',
            min: 0,
            max: 10000,
          },
        ],
      },
    ]);
    devices = await externalIntegration.getDiscoveredDevices(service.selector);
    expect(devices[0]).to.include({ created: true, structure_changed: true });
  });
});

describe('externalIntegration poll silent no-op', () => {
  it('should silently skip a scheduled poll when the integration is not RUNNING/DEGRADED', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.STOPPED });
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.sendCommand = fake.resolves({ success: true });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    await proxyService.device.poll({ external_id: 'ext:x:plug', selector: 'plug', params: [] });
    sinonAssert.notCalled(externalIntegration.sendCommand);
    // an ERROR integration is skipped the same way
    await db.Service.update({ status: SERVICE_STATUS.ERROR }, { where: { id: service.id } });
    await proxyService.device.poll({ external_id: 'ext:x:plug', selector: 'plug', params: [] });
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should still poll a RUNNING or DEGRADED integration', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.DEGRADED });
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.sendCommand = fake.resolves({ success: true });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    await proxyService.device.poll({ external_id: 'ext:x:plug', selector: 'plug', params: [] });
    sinonAssert.calledOnce(externalIntegration.sendCommand);
  });

  it('should still throw on setValue: the user acting on a device must see the error', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.STOPPED });
    const { externalIntegration, stateManager } = buildSupervisor();
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    try {
      await proxyService.device.setValue(
        { external_id: 'ext:x:plug', selector: 'plug', params: [] },
        { external_id: 'ext:x:plug:power', category: 'switch', type: 'binary' },
        1,
      );
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
    }
  });
});

describe('externalIntegration.getContainerStartedAt', () => {
  it('should return the Docker start date of the container', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectContainer: fake.resolves({ State: { Running: true, StartedAt: '2026-07-20T08:00:00.000000000Z' } }),
      },
    });
    expect(await externalIntegration.getContainerStartedAt(service)).to.equal('2026-07-20T08:00:00.000000000Z');
  });

  it('should return null without container, without Docker or on inspect failure', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectContainer: fake.rejects(new Error('NO_SUCH_CONTAINER')),
      },
    });
    expect(await externalIntegration.getContainerStartedAt(service)).to.equal(null);
    expect(await externalIntegration.getContainerStartedAt({ ...service, container_id: null })).to.equal(null);
    externalIntegration.available = false;
    expect(await externalIntegration.getContainerStartedAt(service)).to.equal(null);
    const { externalIntegration: withoutStartedAt } = buildSupervisor();
    expect(await withoutStartedAt.getContainerStartedAt(service)).to.equal(null);
  });
});
