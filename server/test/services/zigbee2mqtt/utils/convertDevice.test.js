const { assert } = require('chai');
const { convertDevice } = require('../../../../services/zigbee2mqtt/utils/convertDevice');

const serviceId = '6a37dd9d-48c7-4d09-a7bb-33f257edb78d';

const notManagedDevice = {
  friendly_name: 'Not supported device',
  model: 'not_supported_device',
};

const managedDevice = {
  friendly_name: 'Xiaomi Aqara Sensor',
  model: 'WXKG11LM',
};

const notManagedGladysDevice = {
  name: notManagedDevice.friendly_name,
  external_id: `zigbee2mqtt:${notManagedDevice.friendly_name}`,
  model: notManagedDevice.model,
  features: [],
  should_poll: false,
  service_id: serviceId,
  supported: false,
};

const managedGladysDevice = {
  name: managedDevice.friendly_name,
  external_id: `zigbee2mqtt:${managedDevice.friendly_name}`,
  model: managedDevice.model,
  features: [
    {
      category: 'button',
      external_id: `zigbee2mqtt:${managedDevice.friendly_name}:click`,
      has_feedback: false,
      max: 1,
      min: 0,
      read_only: true,
      selector: `zigbee2mqtt:${managedDevice.friendly_name}:click`,
      type: 'click',
    },
  ],
  should_poll: false,
  service_id: serviceId,
  supported: true,
};

describe('zigbee2mqtt convertDevice', () => {
  it('should return not managed device', () => {
    const result = convertDevice(notManagedDevice, serviceId);
    return assert.deepEqual(result, notManagedGladysDevice);
  });
  it('should return managed device', () => {
    const result = convertDevice(managedDevice, serviceId);
    return assert.deepEqual(result, managedGladysDevice);
  });
});
