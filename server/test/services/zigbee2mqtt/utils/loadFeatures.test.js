const { assert } = require('chai');
const { loadFeatures } = require('../../../../services/zigbee2mqtt/utils/loadFeatures');

const name = 'Device';
const model = 'WXKG11LM';

const expectedFeaturesWithBatteryAndLinkQuality = [
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
  {
    category: 'signal-strength',
    type: 'integer',
    unit: 'lqi',
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 255,
    name: 'Link Quality',
    external_id: 'zigbee2mqtt:Device:signal-strength:integer:linkquality',
    selector: 'zigbee2mqtt:Device:signal-strength:integer:linkquality',
    zigbeeField: 'linkquality',
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
  it('should return features with battery and link quality', () => {
    const features = loadFeatures(name, model, true);
    return assert.deepEqual(features, expectedFeaturesWithBatteryAndLinkQuality);
  });
  it('should return features without battery and link quality', () => {
    const features = loadFeatures(name, model, false);
    return assert.deepEqual(features, expectedFeatures);
  });
});
