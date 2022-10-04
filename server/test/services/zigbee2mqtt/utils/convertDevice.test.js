const { assert } = require('chai');
const { convertDevice } = require('../../../../services/zigbee2mqtt/utils/convertDevice');

const serviceId = '6a37dd9d-48c7-4d09-a7bb-33f257edb78d';
describe('zigbee2mqtt convertDevice', () => {
  it('should return not managed device', () => {
    const notManagedDevice = {
      friendly_name: 'Not supported device',
    };

    const result = convertDevice(notManagedDevice, serviceId);

    const notManagedGladysDevice = {
      name: notManagedDevice.friendly_name,
      external_id: `zigbee2mqtt:${notManagedDevice.friendly_name}`,
      model: undefined,
      features: [],
      should_poll: false,
      service_id: serviceId,
    };
    return assert.deepEqual(result, notManagedGladysDevice);
  });

  it('should return managed device', () => {
    const managedDevice = {
      friendly_name: 'Xiaomi Aqara Sensor',
      definition: {
        exposes: [
          {
            type: 'enum',
            name: 'action',
            property: 'action',
            values: ['value1'],
          },
        ],
        model: 'WXKG11LM',
      },
    };

    const result = convertDevice(managedDevice, serviceId);

    const managedGladysDevice = {
      name: managedDevice.friendly_name,
      external_id: `zigbee2mqtt:${managedDevice.friendly_name}`,
      model: 'WXKG11LM',
      features: [
        {
          category: 'button',
          external_id: `zigbee2mqtt:${managedDevice.friendly_name}:button:click:action`,
          has_feedback: false,
          max: 1,
          min: 0,
          read_only: true,
          name: 'Action',
          selector: `zigbee2mqtt-xiaomi-aqara-sensor-button-click-action`,
          type: 'click',
          unit: null,
        },
      ],
      should_poll: false,
      service_id: serviceId,
    };
    return assert.deepEqual(result, managedGladysDevice);
  });
});
