const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');
const { SMOKE_CHAMBER_CONTAMINATION } = require('../../../../utils/constants');

describe('zigbee2mqtt smoke detector enumType', () => {
  const chamberContaminationExpose = {
    name: 'chamber_contamination',
    property: 'chamber_contamination',
    type: 'enum',
    access: 5,
    values: ['normal', 'light_contamination', 'medium_contamination', 'critical_contamination'],
  };

  it('should read every chamber contamination level', () => {
    assert.equal(enumType.readValue(chamberContaminationExpose, 'normal'), SMOKE_CHAMBER_CONTAMINATION.NORMAL);
    assert.equal(
      enumType.readValue(chamberContaminationExpose, 'light_contamination'),
      SMOKE_CHAMBER_CONTAMINATION.LIGHT,
    );
    assert.equal(
      enumType.readValue(chamberContaminationExpose, 'medium_contamination'),
      SMOKE_CHAMBER_CONTAMINATION.MEDIUM,
    );
    assert.equal(
      enumType.readValue(chamberContaminationExpose, 'critical_contamination'),
      SMOKE_CHAMBER_CONTAMINATION.CRITICAL,
    );
  });

  it('should not read an unknown chamber contamination level', () => {
    assert.equal(enumType.readValue(chamberContaminationExpose, 'unknown_contamination'), undefined);
  });

  it('should write a chamber contamination level', () => {
    assert.equal(
      enumType.writeValue(chamberContaminationExpose, SMOKE_CHAMBER_CONTAMINATION.CRITICAL),
      'critical_contamination',
    );
  });

  it('should build the chamber contamination feature', () => {
    const [feature] = buildFeatures('smoke-detector', chamberContaminationExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 3,
      category: 'smoke-sensor',
      type: 'chamber-contamination',
      name: 'Chamber contamination',
      external_id: 'zigbee2mqtt:smoke-detector:smoke-sensor:chamber-contamination:chamber_contamination',
      selector: 'zigbee2mqtt-smoke-detector-smoke-sensor-chamber-contamination-chamber-contamination',
      unit: null,
    });
  });
});
