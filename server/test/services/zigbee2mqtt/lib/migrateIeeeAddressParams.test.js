const { expect } = require('chai');
const sinon = require('sinon');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt migrateIeeeAddressParams', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: sinon.fake.resolves(null),
      },
      stateManager: {
        get: sinon.stub(),
      },
      device: {
        create: sinon.fake.resolves({}),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing when no devices are discovered', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {};
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.notCalled(gladys.device.create);
  });

  it('should skip devices without ieee_address', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'device-no-ieee': {
        friendly_name: 'device-no-ieee',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.notCalled(gladys.device.create);
  });

  it('should skip devices not yet registered in Gladys', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'new-device': {
        friendly_name: 'new-device',
        ieee_address: '0xaabbccddeeff0011',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    gladys.stateManager.get.returns(null);
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.notCalled(gladys.device.create);
  });

  it('should skip devices that already have ieee_address param', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'existing-device': {
        friendly_name: 'existing-device',
        ieee_address: '0xaabbccddeeff0011',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    gladys.stateManager.get.returns({
      id: 'gladys-id',
      name: 'existing-device',
      params: [{ name: 'ieee_address', value: '0xaabbccddeeff0011' }],
    });
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.notCalled(gladys.device.create);
  });

  it('should call gladys.device.create for existing device missing ieee_address param', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'existing-device': {
        friendly_name: 'existing-device',
        ieee_address: '0xaabbccddeeff0011',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    gladys.stateManager.get.returns({
      id: 'gladys-id',
      name: 'existing-device',
      params: [],
    });
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.calledOnce(gladys.device.create);
    const createdDevice = gladys.device.create.firstCall.args[0];
    expect(createdDevice.params).to.deep.equal([{ name: 'ieee_address', value: '0xaabbccddeeff0011' }]);
    expect(createdDevice.external_id).to.equal('zigbee2mqtt:existing-device');
  });

  it('should call gladys.device.create for existing device with no params field', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'existing-device': {
        friendly_name: 'existing-device',
        ieee_address: '0xaabbccddeeff0022',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    gladys.stateManager.get.returns({
      id: 'gladys-id',
      name: 'existing-device',
    });
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.calledOnce(gladys.device.create);
  });

  it('should migrate multiple devices and skip already-migrated ones', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'device-needs-migration': {
        friendly_name: 'device-needs-migration',
        ieee_address: '0x1111111111111111',
        definition: { exposes: [], model: 'MODEL_A' },
      },
      'device-already-migrated': {
        friendly_name: 'device-already-migrated',
        ieee_address: '0x2222222222222222',
        definition: { exposes: [], model: 'MODEL_B' },
      },
      'device-not-in-db': {
        friendly_name: 'device-not-in-db',
        ieee_address: '0x3333333333333333',
        definition: { exposes: [], model: 'MODEL_C' },
      },
    };
    gladys.stateManager.get
      .withArgs('deviceByExternalId', 'zigbee2mqtt:device-needs-migration')
      .returns({ id: 'id-1', name: 'device-needs-migration', params: [] })
      .withArgs('deviceByExternalId', 'zigbee2mqtt:device-already-migrated')
      .returns({
        id: 'id-2',
        name: 'device-already-migrated',
        params: [{ name: 'ieee_address', value: '0x2222222222222222' }],
      })
      .withArgs('deviceByExternalId', 'zigbee2mqtt:device-not-in-db')
      .returns(null);
    // EXECUTE
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT - only the device needing migration should trigger create
    sinon.assert.calledOnce(gladys.device.create);
    const createdDevice = gladys.device.create.firstCall.args[0];
    expect(createdDevice.external_id).to.equal('zigbee2mqtt:device-needs-migration');
    expect(createdDevice.params).to.deep.equal([{ name: 'ieee_address', value: '0x1111111111111111' }]);
  });

  it('should not throw when gladys.device.create fails', async () => {
    // PREPARE
    zigbee2mqttManager.discoveredDevices = {
      'failing-device': {
        friendly_name: 'failing-device',
        ieee_address: '0xdeadbeef00000000',
        definition: { exposes: [], model: 'TEST' },
      },
    };
    gladys.stateManager.get.returns({ id: 'gladys-id', name: 'failing-device', params: [] });
    gladys.device.create = sinon.fake.rejects(new Error('DB error'));
    // EXECUTE - should not throw
    await zigbee2mqttManager.migrateIeeeAddressParams();
    // ASSERT
    sinon.assert.calledOnce(gladys.device.create);
  });
});
