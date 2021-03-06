const { assert } = require('chai');
const { loadFeatures } = require('../../../../services/zigbee2mqtt/utils/loadFeatures');

const name = 'Device';
const model = 'WXKG11LM';

const expectedFeaturesWithBattery = [
  {
    category: 'button',
    type: 'click',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    name: 'Button',
    external_id: 'zigbee2mqtt:Device:button:click:action',
    selector: 'zigbee2mqtt:Device:button:click:action',
    zigbeeField: 'action',
  },
  {
    category: 'battery',
    type: 'integer',
    unit: 'percent',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 100,
    name: 'Battery',
    external_id: 'zigbee2mqtt:Device:battery:integer:battery',
    selector: 'zigbee2mqtt:Device:battery:integer:battery',
    zigbeeField: 'battery',
  },
];

const expectedFeatures = [
  {
    category: 'button',
    type: 'click',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 1,
    name: 'Button',
    external_id: 'zigbee2mqtt:Device:button:click:action',
    selector: 'zigbee2mqtt:Device:button:click:action',
    zigbeeField: 'action',
  },
];

describe('zigbee2mqttService loadFeatures', () => {
  it('should return features with battery', () => {
    const features = loadFeatures(name, model, true);
    return assert.deepEqual(features, expectedFeaturesWithBattery);
  });
  it('should return features without battery', () => {
    const features = loadFeatures(name, model, false);
    return assert.deepEqual(features, expectedFeatures);
  });
});
