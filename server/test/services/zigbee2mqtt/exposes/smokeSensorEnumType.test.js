const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');
const { CONTAMINATION_STATE } = require('../../../../utils/constants');

describe('zigbee2mqtt smoke detector enumType', () => {
  const chamberContaminationExpose = {
    name: 'chamber_contamination',
    property: 'chamber_contamination',
    type: 'enum',
    access: 5,
    values: ['normal', 'light_contamination', 'medium_contamination', 'critical_contamination'],
  };

  it('should read every contamination state', () => {
    assert.equal(enumType.readValue(chamberContaminationExpose, 'normal'), CONTAMINATION_STATE.NORMAL);
    assert.equal(enumType.readValue(chamberContaminationExpose, 'light_contamination'), CONTAMINATION_STATE.LOW);
    assert.equal(enumType.readValue(chamberContaminationExpose, 'medium_contamination'), CONTAMINATION_STATE.WARNING);
    assert.equal(
      enumType.readValue(chamberContaminationExpose, 'critical_contamination'),
      CONTAMINATION_STATE.CRITICAL,
    );
  });

  it('should not read an unknown contamination state', () => {
    assert.equal(enumType.readValue(chamberContaminationExpose, 'unknown_contamination'), undefined);
  });

  it('should write a contamination state', () => {
    assert.equal(
      enumType.writeValue(chamberContaminationExpose, CONTAMINATION_STATE.CRITICAL),
      'critical_contamination',
    );
  });

  it('should build the contamination state feature', () => {
    const [feature] = buildFeatures('smoke-detector', chamberContaminationExpose);

    assert.deepEqual(feature, {
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 3,
      category: 'smoke-sensor',
      type: 'contamination-state',
      name: 'Chamber contamination',
      external_id: 'zigbee2mqtt:smoke-detector:smoke-sensor:contamination-state:chamber_contamination',
      selector: 'zigbee2mqtt-smoke-detector-smoke-sensor-contamination-state-chamber-contamination',
      unit: null,
    });
  });
});
