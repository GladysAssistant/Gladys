const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');
const { BUTTON_PUSH } = require('../../../../utils/constants');

describe('zigbee2mqtt Bosch siren alarm enumType', () => {
  const triggerAlarmExpose = {
    name: 'trigger_alarm',
    property: 'trigger_alarm',
    type: 'enum',
    access: 2,
    values: ['trigger'],
  };

  const stopAlarmExpose = {
    name: 'stop_alarm',
    property: 'stop_alarm',
    type: 'enum',
    access: 2,
    values: ['stop'],
  };

  it('should write trigger_alarm value', () => {
    const result = enumType.writeValue(triggerAlarmExpose, BUTTON_PUSH.PRESSED);
    assert.equal(result, 'trigger');
  });

  it('should write stop_alarm value', () => {
    const result = enumType.writeValue(stopAlarmExpose, BUTTON_PUSH.PRESSED);
    assert.equal(result, 'stop');
  });

  it('should build trigger_alarm feature as writable button push', () => {
    const [feature] = buildFeatures('bosch-siren', triggerAlarmExpose);

    assert.deepEqual(feature, {
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      category: 'button',
      type: 'push',
      name: 'Trigger alarm',
      external_id: 'zigbee2mqtt:bosch-siren:button:push:trigger_alarm',
      selector: 'zigbee2mqtt-bosch-siren-button-push-trigger-alarm',
      unit: null,
    });
  });

  it('should build stop_alarm feature as writable button push', () => {
    const [feature] = buildFeatures('bosch-siren', stopAlarmExpose);

    assert.deepEqual(feature, {
      read_only: false,
      has_feedback: false,
      min: 0,
      max: 1,
      category: 'button',
      type: 'push',
      name: 'Stop alarm',
      external_id: 'zigbee2mqtt:bosch-siren:button:push:stop_alarm',
      selector: 'zigbee2mqtt-bosch-siren-button-push-stop-alarm',
      unit: null,
    });
  });
});
