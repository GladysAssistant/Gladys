const { assert } = require('chai');

const binaryType = require('../../../../services/zigbee2mqtt/exposes/binaryType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');

describe('zigbee2mqtt smoke detector binaryType', () => {
  const temporaryMuteExpose = {
    name: 'temporary_mute',
    property: 'temporary_mute',
    type: 'binary',
    access: 7,
    value_on: true,
    value_off: false,
  };

  it('should write the value hushing the siren', () => {
    assert.equal(binaryType.writeValue(temporaryMuteExpose, 1), true);
  });

  it('should write the value letting the siren ring again', () => {
    assert.equal(binaryType.writeValue(temporaryMuteExpose, 0), false);
  });

  it('should read the mute command back', () => {
    assert.equal(binaryType.readValue(temporaryMuteExpose, true), 1);
    assert.equal(binaryType.readValue(temporaryMuteExpose, false), 0);
  });

  it('should build a writable smoke sensor feature, not a switch', () => {
    const [feature] = buildFeatures('smoke-detector', temporaryMuteExpose);

    assert.deepEqual(feature, {
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      category: 'smoke-sensor',
      type: 'temporary-mute',
      name: 'Temporary mute',
      external_id: 'zigbee2mqtt:smoke-detector:smoke-sensor:temporary-mute:temporary_mute',
      selector: 'zigbee2mqtt-smoke-detector-smoke-sensor-temporary-mute-temporary-mute',
      unit: null,
    });
  });
});
