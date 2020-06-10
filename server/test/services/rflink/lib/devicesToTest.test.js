const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const DEVICES = [
  {
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: `Prise `,
    selector: `rflink:86aa7:11`,
    external_id: `rflink:86aa7:11`,
    model: 'Tristate',
    should_poll: false,
    features: [
      {
        name: 'switch',
        selector: `rflink:86aa7:switch:11`,
        external_id: `rflink:86aa7:switch:11`,
        rfcode: 'CMD',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        read_only: false,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      },
    ],
  },
  {
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: `Prise `,
    selector: `rflink:86aa70:10`,
    external_id: `rflink:86aa70:10`,
    model: 'Tristate',
    should_poll: false,
    features: [
      {
        name: 'switch',
        selector: `rflink:86aa70:switch:10`,
        external_id: `rflink:86aa70:switch:10`,
        rfcode: 'CMD',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        read_only: false,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1,
      },
    ],
  },
];

module.exports = DEVICES;
