const { assert } = require('chai');

const compositeType = require('../../../../services/zigbee2mqtt/exposes/compositeType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');
const { mapExpose } = require('../../../../services/zigbee2mqtt/utils/features/mapExpose');

describe('zigbee2mqtt siren warning compositeType', () => {
  // Heiman HS2WD-E indoor siren
  // https://www.zigbee2mqtt.io/devices/HS2WD-E.html
  const warningExpose = {
    name: 'warning',
    property: 'warning',
    label: 'Warning',
    type: 'composite',
    access: 2,
    features: [
      {
        name: 'strobe',
        property: 'strobe',
        type: 'binary',
        access: 2,
        value_on: true,
        value_off: false,
      },
      {
        name: 'strobe_duty_cycle',
        property: 'strobe_duty_cycle',
        type: 'numeric',
        access: 2,
        value_min: 0,
        value_max: 10,
      },
      {
        name: 'duration',
        property: 'duration',
        type: 'numeric',
        access: 2,
        unit: 's',
      },
      {
        name: 'mode',
        property: 'mode',
        type: 'enum',
        access: 2,
        values: ['stop', 'emergency'],
      },
    ],
  };

  it('should start the siren', () => {
    const result = compositeType.writeValue(warningExpose, 1);

    assert.deepEqual(result, { mode: 'emergency', strobe: true, duration: 600 });
  });

  it('should stop the siren', () => {
    const result = compositeType.writeValue(warningExpose, 0);

    assert.deepEqual(result, { mode: 'stop', strobe: false, duration: 0 });
  });

  it('should keep the device supported modes only', () => {
    // A device not exposing the "emergency" mode falls back to another supported one
    const expose = {
      ...warningExpose,
      features: [{ name: 'mode', property: 'mode', type: 'enum', access: 2, values: ['stop', 'burglar'] }],
    };

    assert.deepEqual(compositeType.writeValue(expose, 1), { mode: 'burglar' });
    assert.deepEqual(compositeType.writeValue(expose, 0), { mode: 'stop' });
  });

  it('should fallback on the Zigbee default mode when no mode is exposed', () => {
    const expose = { name: 'warning', property: 'warning', type: 'composite', access: 2 };

    assert.deepEqual(compositeType.writeValue(expose, 1), { mode: 'emergency' });
    assert.deepEqual(compositeType.writeValue(expose, 0), { mode: 'stop' });
  });

  it('should ignore unknown exposed modes', () => {
    const expose = {
      ...warningExpose,
      features: [{ name: 'mode', property: 'mode', type: 'enum', access: 2, values: ['unknown_mode'] }],
    };

    assert.deepEqual(compositeType.writeValue(expose, 1), { mode: 'emergency' });
  });

  it('should not read the write-only warning command', () => {
    const result = compositeType.readValue(warningExpose, { mode: 'stop' });

    assert.equal(result, undefined);
  });

  it('should build the warning feature as a writable siren', () => {
    const [feature] = buildFeatures('heiman-indoor-siren', warningExpose);

    assert.deepEqual(feature, {
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      category: 'siren',
      type: 'binary',
      unit: null,
      name: 'Warning',
      external_id: 'zigbee2mqtt:heiman-indoor-siren:siren:binary:warning',
      selector: 'zigbee2mqtt-heiman-indoor-siren-siren-binary-warning',
    });
  });

  it('should not expose the warning sub-features as standalone features', () => {
    const features = mapExpose('heiman-indoor-siren', warningExpose);

    assert.deepEqual(
      features.map((feature) => feature.external_id),
      ['zigbee2mqtt:heiman-indoor-siren:siren:binary:warning'],
    );
  });
});
