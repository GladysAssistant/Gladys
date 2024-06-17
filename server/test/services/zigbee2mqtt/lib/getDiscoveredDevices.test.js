const { expect } = require('chai');
const sinon = require('sinon');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const discoveredDevices = require('./payloads/mqtt_devices_get.json');
const expectedDevicesPayload = require('./payloads/event_device_result.json');

const aqaraWithDuplicateFeatureDevice = require('./payloads/aqara_with_duplicate_feature_mqtt.json');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
  stateManager: {
    get: {},
  },
};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getDiscoveredDevices', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);

  beforeEach(() => {
    gladys.stateManager.get = sinon.stub();
  });

  it('get no discovered devices', async () => {
    // EXECUTE
    const devices = zigbee2MqttService.device.getDiscoveredDevices();
    // ASSERT
    expect(devices).deep.eq([]);
  });

  it('get discovered devices', async () => {
    // PREPARE
    gladys.stateManager.get
      .onFirstCall()
      .returns({ id: 'gladys-id', room_id: 'room_id', name: 'device-name' })
      .onSecondCall()
      .returns(expectedDevicesPayload[1])
      .onThirdCall()
      .returns(false);

    discoveredDevices
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2MqttService.device.discoveredDevices[device.friendly_name] = device;
      });

    // EXECUTE
    const devices = zigbee2MqttService.device.getDiscoveredDevices();
    // ASSERT
    expect(devices).deep.eq(expectedDevicesPayload);
  });

  it('get discovered devices without duplicate features', async () => {
    // PREPARE
    gladys.stateManager.get
      .onFirstCall()
      .returns({ id: 'gladys-id', room_id: 'room_id', name: 'device-name' })
      .onSecondCall()
      .returns(expectedDevicesPayload[3])
      .onThirdCall()
      .returns(false);

    aqaraWithDuplicateFeatureDevice
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2MqttService.device.discoveredDevices[device.friendly_name] = device;
      });

    // EXECUTE
    const devices = zigbee2MqttService.device.getDiscoveredDevices();
    const aqaraDevice = devices.find((d) => d.model === 'WSDCGQ11LM');
    // ASSERT
    expect(aqaraDevice.features.filter((f) => f.category === 'humidity-sensor')).to.have.lengthOf(
      1,
      'should not have duplicate humidity',
    );
  });

  it('filter discovered devices', async () => {
    // PREPARE
    gladys.stateManager.get
      .onFirstCall()
      .returns({ id: 'gladys-id', room_id: 'room_id', name: 'device-name' })
      .onSecondCall()
      .returns(expectedDevicesPayload[1])
      .onThirdCall()
      .returns(false);

    discoveredDevices
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2MqttService.device.discoveredDevices[device.friendly_name] = device;
      });

    // EXECUTE
    const devices = zigbee2MqttService.device.getDiscoveredDevices({ filter_existing: true });
    // ASSERT
    // Expected devices but first
    const filteredExpectedDevices = [...expectedDevicesPayload];
    filteredExpectedDevices.splice(1, 1);
    expect(devices).deep.eq(filteredExpectedDevices);
  });
});
