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

  const unmappedExpose = {
    name: 'unknown_text',
    property: 'unknown_text',
    type: 'text',
    access: 5,
  };

  it('should read a normal fault state as 0', () => {
    assert.equal(textType.readValue(faultStateExpose, 'normal'), 0);
  });

  it('should read any raised fault as 1', () => {
    assert.equal(textType.readValue(faultStateExpose, 'fault | pollution_fault'), 1);
  });

  it('should read a detector able to ring as 0', () => {
    assert.equal(textType.readValue(mutedExpose, 'normal'), 0);
  });

  it('should read a muted detector as 1', () => {
    assert.equal(textType.readValue(mutedExpose, 'alarm_muted | low_battery_muted'), 1);
  });

  it('should read an unmapped text expose as its raw string', () => {
    assert.equal(textType.readValue(unmappedExpose, 0), '0');
  });

  it('should write a text value', () => {
    assert.equal(textType.writeValue(mutedExpose, 'normal'), 'normal');
  });

  it('should build the fault state as a binary smoke sensor feature', () => {
    const [feature] = buildFeatures('smoke-detector', faultStateExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 1,
      category: 'smoke-sensor',
      type: 'fault',
      name: 'Fault state',
      external_id: 'zigbee2mqtt:smoke-detector:smoke-sensor:fault:fault_state',
      selector: 'zigbee2mqtt-smoke-detector-smoke-sensor-fault-fault-state',
      unit: null,
    });
  });

  it('should build the mute state as a binary smoke sensor feature', () => {
    const [feature] = buildFeatures('smoke-detector', mutedExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 1,
      category: 'smoke-sensor',
      type: 'muted',
      name: 'Muted',
      external_id: 'zigbee2mqtt:smoke-detector:smoke-sensor:muted:muted',
      selector: 'zigbee2mqtt-smoke-detector-smoke-sensor-muted-muted',
      unit: null,
    });
  });

  it('should not build a feature for an unmapped text expose', () => {
    const features = buildFeatures('smoke-detector', unmappedExpose);

    assert.deepEqual(features, []);
  });
});
