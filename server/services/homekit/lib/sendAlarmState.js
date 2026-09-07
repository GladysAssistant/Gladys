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

  // The target is recomputed through its own handler rather than derived a second time here: which
  // target a ringing house keeps is only known inside the accessory, and deciding it in both places
  // is how the two came to disagree.
  service
    .getCharacteristic(Characteristic.SecuritySystemTargetState)
    .emit(this.hap.CharacteristicEventTypes.GET, (error, value) => {
      if (!error) {
        service.updateCharacteristic(Characteristic.SecuritySystemTargetState, value);
      }
    });
}

module.exports = {
  sendAlarmState,
};
