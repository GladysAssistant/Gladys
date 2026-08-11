const { alarmModeToSecuritySystemState, HOMEKIT_SECURITY_SYSTEM_STATE } = require('./buildAlarmAccessory');

/**
 * @description Forward the new alarm mode of a house to HomeKit.
 * @param {string} houseSelector - Selector of the house whose alarm changed.
 * @returns {Promise} Resolve once HomeKit has been updated.
 * @example
 * await sendAlarmState('main-house');
 */
async function sendAlarmState(houseSelector) {
  const accessory = this.alarmAccessories.get(houseSelector);

  // A house created since the bridge was built has no accessory until the next reload.
  if (!accessory) {
    return;
  }

  const { Characteristic, Service } = this.hap;
  const { alarm_mode: alarmMode } = await this.gladys.house.getBySelector(houseSelector);
  // Same fallback as the GET handler: a mode this bridge does not know about is reported as
  // disarmed rather than left alone, which would keep HomeKit showing a stale armed state.
  const state =
    alarmModeToSecuritySystemState[alarmMode] === undefined
      ? HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED
      : alarmModeToSecuritySystemState[alarmMode];

  const service = accessory.getService(Service.SecuritySystem);

  service.updateCharacteristic(Characteristic.SecuritySystemCurrentState, state);
  // The target has no triggered value, so a ringing house keeps the armed target it was set to.
  // Pushing disarmed there would show the alarm as switched off while it is going off.
  if (state !== HOMEKIT_SECURITY_SYSTEM_STATE.ALARM_TRIGGERED) {
    service.updateCharacteristic(Characteristic.SecuritySystemTargetState, state);
  }
}

module.exports = {
  sendAlarmState,
};
