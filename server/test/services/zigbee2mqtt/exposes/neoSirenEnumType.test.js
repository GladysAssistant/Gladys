const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { SIREN_MODE } = require('../../../../utils/constants');

describe('zigbee2mqtt NEO outdoor siren enumType', () => {
  const alarmModeExpose = {
    name: 'alarm_mode',
    property: 'alarm_mode',
    type: 'enum',
    access: 3,
    values: ['alarm_sound', 'alarm_light', 'alarm_sound_light'],
  };

  const alarmStateExpose = {
    name: 'alarm_state',
    property: 'alarm_state',
    type: 'enum',
    access: 1,
    values: ['alarm_sound', 'alarm_light', 'alarm_sound_light', 'normal'],
  };

  const alarmMelodyExpose = {
    name: 'alarm_melody',
    property: 'alarm_melody',
    type: 'enum',
    access: 3,
    values: ['melody_1', 'melody_2', 'melody_3'],
  };

  it('should write alarm_mode values', () => {
    assert.equal(enumType.writeValue(alarmModeExpose, SIREN_MODE.SOUND), 'alarm_sound');
    assert.equal(enumType.writeValue(alarmModeExpose, SIREN_MODE.LIGHT), 'alarm_light');
    assert.equal(enumType.writeValue(alarmModeExpose, SIREN_MODE.SOUND_AND_LIGHT), 'alarm_sound_light');
  });

  it('should not write an alarm_mode value the siren does not expose', () => {
    assert.equal(enumType.writeValue(alarmModeExpose, SIREN_MODE.IDLE), undefined);
  });

  it('should read alarm_mode values', () => {
    assert.equal(enumType.readValue(alarmModeExpose, 'alarm_sound'), SIREN_MODE.SOUND);
    assert.equal(enumType.readValue(alarmModeExpose, 'alarm_light'), SIREN_MODE.LIGHT);
    assert.equal(enumType.readValue(alarmModeExpose, 'alarm_sound_light'), SIREN_MODE.SOUND_AND_LIGHT);
  });

  it('should read alarm_state values', () => {
    assert.equal(enumType.readValue(alarmStateExpose, 'normal'), SIREN_MODE.IDLE);
    // The current zigbee-herdsman-converters publishes the idle state as "no_alarm", while the
    // expose list and the older converters advertise "normal"
    assert.equal(enumType.readValue(alarmStateExpose, 'no_alarm'), SIREN_MODE.IDLE);
    assert.equal(enumType.readValue(alarmStateExpose, 'alarm_sound'), SIREN_MODE.SOUND);
    assert.equal(enumType.readValue(alarmStateExpose, 'alarm_light'), SIREN_MODE.LIGHT);
    assert.equal(enumType.readValue(alarmStateExpose, 'alarm_sound_light'), SIREN_MODE.SOUND_AND_LIGHT);
  });

  it('should write alarm_melody values', () => {
    assert.equal(enumType.writeValue(alarmMelodyExpose, 1), 'melody_1');
    assert.equal(enumType.writeValue(alarmMelodyExpose, 2), 'melody_2');
    assert.equal(enumType.writeValue(alarmMelodyExpose, 3), 'melody_3');
  });

  it('should read alarm_melody values', () => {
    assert.equal(enumType.readValue(alarmMelodyExpose, 'melody_1'), 1);
    assert.equal(enumType.readValue(alarmMelodyExpose, 'melody_3'), 3);
  });

  it('should not read an alarm_melody value which is not a melody number', () => {
    assert.equal(enumType.readValue(alarmMelodyExpose, 'unknown'), undefined);
  });

  it('should not write a melody the siren does not expose', () => {
    assert.equal(enumType.writeValue(alarmMelodyExpose, 4), undefined);
  });

  it('should write the melodies of a siren exposing more than three of them', () => {
    const richMelodyExpose = { ...alarmMelodyExpose, values: [...alarmMelodyExpose.values, 'melody_4'] };

    assert.equal(enumType.writeValue(richMelodyExpose, 4), 'melody_4');
    assert.equal(enumType.readValue(richMelodyExpose, 'melody_4'), 4);
  });
});
