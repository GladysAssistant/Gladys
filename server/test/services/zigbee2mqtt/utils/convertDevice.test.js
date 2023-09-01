const { assert, expect } = require('chai');
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
  it('should return ikea E1743 device', () => {
    const zigbee2mqttDevice = {
      friendly_name: '0x5c0272fffxxxxx',
      ieee_address: '0x5c0272fffeaxxxxx',
      status: 'successful',
      supported: true,
      definition: {
        description: 'TRADFRI ON/OFF switch',
        exposes: [
          {
            access: 1,
            description: 'Remaining battery in %',
            name: 'battery',
            property: 'battery',
            type: 'numeric',
            unit: '%',
            value_max: 100,
            value_min: 0,
          },
          {
            access: 1,
            description: 'Triggered action (e.g. a button click)',
            name: 'action',
            property: 'action',
            type: 'enum',
            values: ['on', 'off', 'brightness_move_down', 'brightness_move_up', 'brightness_stop'],
          },
          {
            access: 1,
            description: 'Link quality (signal strength)',
            name: 'linkquality',
            property: 'linkquality',
            type: 'numeric',
            unit: 'lqi',
            value_max: 255,
            value_min: 0,
          },
        ],
        model: 'E1743',
        options: [
          {
            access: 2,
            description:
              'Set to false to disable the legacy integration (highly recommended), will change structure of the published payload (default true).',
            name: 'legacy',
            property: 'legacy',
            type: 'binary',
            value_off: false,
            value_on: true,
          },
          {
            description:
              'Simulate a brightness value. If this device provides a brightness_move_up or brightness_move_down action it is possible to specify the update interval and delta.',
            features: [
              {
                access: 2,
                description: 'Delta per interval, 20 by default',
                name: 'delta',
                property: 'delta',
                type: 'numeric',
                value_min: 0,
              },
              {
                access: 2,
                description: 'Interval duration',
                name: 'interval',
                property: 'interval',
                type: 'numeric',
                unit: 'ms',
                value_min: 0,
              },
            ],
            name: 'simulated_brightness',
            property: 'simulated_brightness',
            type: 'composite',
          },
        ],
        supports_ota: true,
        vendor: 'IKEA',
      },
    };

    const result = convertDevice(zigbee2mqttDevice, serviceId);

    expect(result).to.deep.equal({
      name: '0x5c0272fffxxxxx',
      model: 'E1743',
      external_id: 'zigbee2mqtt:0x5c0272fffxxxxx',
      features: [
        {
          name: 'Battery',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 100,
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          external_id: 'zigbee2mqtt:0x5c0272fffxxxxx:battery:integer:battery',
          selector: 'zigbee2mqtt-0x5c0272fffxxxxx-battery-integer-battery',
        },
        {
          name: 'Action',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 5,
          category: 'button',
          type: 'click',
          unit: null,
          external_id: 'zigbee2mqtt:0x5c0272fffxxxxx:button:click:action',
          selector: 'zigbee2mqtt-0x5c0272fffxxxxx-button-click-action',
        },
        {
          name: 'Linkquality',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 5,
          category: 'signal',
          type: 'integer',
          unit: null,
          external_id: 'zigbee2mqtt:0x5c0272fffxxxxx:signal:integer:linkquality',
          selector: 'zigbee2mqtt-0x5c0272fffxxxxx-signal-integer-linkquality',
        },
      ],
      should_poll: false,
      service_id: '6a37dd9d-48c7-4d09-a7bb-33f257edb78d',
    });
  });
});
