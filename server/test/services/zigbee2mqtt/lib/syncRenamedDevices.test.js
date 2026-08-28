const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt syncRenamedDevices', () => {
  let zigbee2mqttManager;
  let gladys;

  const buildGladysDevice = () => ({
    id: 'device-id',
    name: 'old-name',
    selector: 'zigbee2mqtt-old-name',
    external_id: 'zigbee2mqtt:old-name',
    service_id: serviceId,
    room_id: 'room-id',
    features: [
      {
        id: 'feature-id',
        name: 'On/Off',
        selector: 'zigbee2mqtt-old-name-switch-binary-state',
        external_id: 'zigbee2mqtt:old-name:switch:binary:state',
        category: 'switch',
        type: 'binary',
      },
      {
        id: 'feature-id-2',
        name: 'Unexpected external id',
        selector: 'zigbee2mqtt-other-feature',
        external_id: 'zigbee2mqtt:another-prefix:switch:binary:state',
        category: 'switch',
        type: 'binary',
      },
    ],
    params: [{ id: 'param-id', name: 'IEEE_ADDRESS', value: '0x00158d00045b2740', device_id: 'device-id' }],
  });

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      device: {
        get: fake.resolves([]),
        create: fake.resolves(null),
        setParam: fake.resolves(null),
      },
      stateManager: {
        get: fake.returns(null),
        deleteState: fake.returns(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should rename device and features external_id when friendly_name changed', async () => {
    const gladysDevice = buildGladysDevice();
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.calledOnce(gladys.device.create);
    const createdDevice = gladys.device.create.firstCall.args[0];
    expect(createdDevice.external_id).to.equal('zigbee2mqtt:new-name');
    expect(createdDevice.name).to.equal('new-name');
    // Selectors are kept so scenes and history are preserved
    expect(createdDevice.selector).to.equal('zigbee2mqtt-old-name');
    expect(createdDevice.features[0].external_id).to.equal('zigbee2mqtt:new-name:switch:binary:state');
    expect(createdDevice.features[0].selector).to.equal('zigbee2mqtt-old-name-switch-binary-state');
    expect(createdDevice.features[0].id).to.equal('feature-id');
    // A feature external_id not built on the friendly_name is left untouched
    expect(createdDevice.features[1].external_id).to.equal('zigbee2mqtt:another-prefix:switch:binary:state');
    // Stale RAM cache entries are removed
    assert.calledWithExactly(gladys.stateManager.deleteState, 'deviceByExternalId', 'zigbee2mqtt:old-name');
    assert.calledWithExactly(
      gladys.stateManager.deleteState,
      'deviceFeatureByExternalId',
      'zigbee2mqtt:old-name:switch:binary:state',
    );
  });

  it('should keep custom Gladys device name on rename', async () => {
    const gladysDevice = buildGladysDevice();
    gladysDevice.name = 'My custom name';
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    const createdDevice = gladys.device.create.firstCall.args[0];
    expect(createdDevice.name).to.equal('My custom name');
    expect(createdDevice.external_id).to.equal('zigbee2mqtt:new-name');
  });

  it('should do nothing when friendly_name did not change', async () => {
    const gladysDevice = buildGladysDevice();
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'old-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
    assert.notCalled(gladys.device.setParam);
  });

  it('should backfill IEEE address param on devices without it', async () => {
    const gladysDevice = buildGladysDevice();
    gladysDevice.params = [];
    gladys.device.get = fake.resolves([gladysDevice]);
    const ramDevice = { ...gladysDevice, params: [] };
    gladys.stateManager.get = fake.returns(ramDevice);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'old-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
    assert.calledOnceWithExactly(gladys.device.setParam, gladysDevice, 'IEEE_ADDRESS', '0x00158d00045b2740');
    expect(ramDevice.params).to.deep.equal([
      { name: 'IEEE_ADDRESS', value: '0x00158d00045b2740', device_id: 'device-id' },
    ]);
  });

  it('should not rename a device without stored IEEE address', async () => {
    const gladysDevice = buildGladysDevice();
    delete gladysDevice.params;
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE: no z2m device with the same name, and nothing to match on
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
    assert.notCalled(gladys.device.setParam);
  });

  it('should ignore devices with a non zigbee2mqtt external_id', async () => {
    const gladysDevice = buildGladysDevice();
    gladysDevice.external_id = 'other-service:device';
    gladys.device.get = fake.resolves([gladysDevice, { name: 'no-external-id' }]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
    assert.notCalled(gladys.device.setParam);
  });

  it('should do nothing when the device was removed from Zigbee2mqtt', async () => {
    const gladysDevice = buildGladysDevice();
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([]);
    // ASSERT
    assert.notCalled(gladys.device.create);
    assert.notCalled(gladys.device.setParam);
  });

  it('should not match name against a different device (cross-rename)', async () => {
    const gladysDevice = buildGladysDevice();
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE: "old-name" now belongs to another physical device,
    // ours (matched by IEEE address) was renamed "new-name"
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'old-name', ieee_address: '0xother', type: 'Router' },
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.calledOnce(gladys.device.create);
    expect(gladys.device.create.firstCall.args[0].external_id).to.equal('zigbee2mqtt:new-name');
  });

  it('should ignore the coordinator and devices without ieee_address', async () => {
    const gladysDevice = buildGladysDevice();
    gladys.device.get = fake.resolves([gladysDevice]);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Coordinator' },
      { friendly_name: 'other' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
  });

  it('should not fail when device.get throws', async () => {
    gladys.device.get = fake.rejects(new Error('DB error'));
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
    ]);
    // ASSERT
    assert.notCalled(gladys.device.create);
  });

  it('should continue with other devices when one rename fails', async () => {
    const firstDevice = buildGladysDevice();
    const secondDevice = buildGladysDevice();
    secondDevice.id = 'device-id-2';
    secondDevice.external_id = 'zigbee2mqtt:other-old-name';
    secondDevice.name = 'other-old-name';
    delete secondDevice.features;
    secondDevice.params = [{ id: 'param-id-2', name: 'IEEE_ADDRESS', value: '0xsecond', device_id: 'device-id-2' }];
    gladys.device.get = fake.resolves([firstDevice, secondDevice]);
    gladys.device.create = sinon.stub();
    gladys.device.create.onFirstCall().rejects(new Error('SequelizeUniqueConstraintError'));
    gladys.device.create.onSecondCall().resolves(null);
    // EXECUTE
    await zigbee2mqttManager.syncRenamedDevices([
      { friendly_name: 'new-name', ieee_address: '0x00158d00045b2740', type: 'Router' },
      { friendly_name: 'other-new-name', ieee_address: '0xsecond', type: 'Router' },
    ]);
    // ASSERT
    expect(gladys.device.create.callCount).to.equal(2);
    expect(gladys.device.create.secondCall.args[0].external_id).to.equal('zigbee2mqtt:other-new-name');
  });
});
