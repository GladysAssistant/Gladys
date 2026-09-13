const { assert } = require('chai');

const textType = require('../../../../services/zigbee2mqtt/exposes/textType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');

describe('zigbee2mqtt textType', () => {
  const faultStateExpose = {
    name: 'fault_state',
    property: 'fault_state',
    type: 'text',
    access: 5,
  };

  const mutedExpose = {
    name: 'muted',
    property: 'muted',
    type: 'text',
    access: 5,
  };

  it('should read a text value', () => {
    assert.equal(textType.readValue(faultStateExpose, 'fault | pollution_fault'), 'fault | pollution_fault');
  });

  it('should read a non-string value as a string', () => {
    assert.equal(textType.readValue(faultStateExpose, 0), '0');
  });

  it('should write a text value', () => {
    assert.equal(textType.writeValue(mutedExpose, 'normal'), 'normal');
  });

  it('should build the fault state as a text feature', () => {
    const [feature] = buildFeatures('smoke-detector', faultStateExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 0,
      category: 'text',
      type: 'text',
      name: 'Fault state',
      external_id: 'zigbee2mqtt:smoke-detector:text:text:fault_state',
      selector: 'zigbee2mqtt-smoke-detector-text-text-fault-state',
      unit: null,
    });
  });

  it('should build the muted state as a text feature', () => {
    const [feature] = buildFeatures('smoke-detector', mutedExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 0,
      category: 'text',
      type: 'text',
      name: 'Muted',
      external_id: 'zigbee2mqtt:smoke-detector:text:text:muted',
      selector: 'zigbee2mqtt-smoke-detector-text-text-muted',
      unit: null,
    });
  });

  it('should not build a feature for an unmapped text expose', () => {
    const features = buildFeatures('smoke-detector', {
      name: 'unknown_text',
      property: 'unknown_text',
      type: 'text',
      access: 5,
    });

    assert.deepEqual(features, []);
  });
});
