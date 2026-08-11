const { ALARM_MODES } = require('../../../utils/constants');
const { ConflictError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

// Values of the HomeKit SecuritySystemCurrentState characteristic. The target one uses the same
// values without ALARM_TRIGGERED: HomeKit lets an alarm report that it went off, not be asked to.
const HOMEKIT_SECURITY_SYSTEM_STATE = {
  STAY_ARM: 0,
  AWAY_ARM: 1,
  NIGHT_ARM: 2,
  DISARMED: 3,
  ALARM_TRIGGERED: 4,
};

// Gladys arms the whole house or only part of it, where HomeKit distinguishes being away from
// staying home — which is the same idea seen from the other side: a partially armed house is one
// its occupants are still living in.
const alarmModeToSecuritySystemState = {
  [ALARM_MODES.ARMED]: HOMEKIT_SECURITY_SYSTEM_STATE.AWAY_ARM,
  [ALARM_MODES.PARTIALLY_ARMED]: HOMEKIT_SECURITY_SYSTEM_STATE.STAY_ARM,
  [ALARM_MODES.DISARMED]: HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED,
  [ALARM_MODES.PANIC]: HOMEKIT_SECURITY_SYSTEM_STATE.ALARM_TRIGGERED,
};

// NIGHT_ARM is absent on purpose: Gladys has no night mode, and offering a state the house cannot
// honour would let the Home app ask for something that silently does nothing.
const SUPPORTED_TARGET_STATES = [
  HOMEKIT_SECURITY_SYSTEM_STATE.STAY_ARM,
  HOMEKIT_SECURITY_SYSTEM_STATE.AWAY_ARM,
  HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED,
];

/**
 * @description Create the HomeKit accessory exposing the alarm of a Gladys house.
 * @param {object} house - Gladys house to expose.
 * @returns {object} HomeKit accessory to expose.
 * @example
 * buildAlarmAccessory({ id: '...', name: 'Maison', selector: 'maison' });
 */
function buildAlarmAccessory(house) {
  const { Characteristic, CharacteristicEventTypes, Service } = this.hap;

  // The alarm is not a device: it lives on the house, so this accessory is built from a house
  // rather than from `buildAccessory`, and its UUID is the house id.
  const accessory = new this.hap.Accessory(house.name.substring(0, 64), house.id);
  const service = new Service.SecuritySystem(house.name.substring(0, 64));

  const readState = async () => {
    const { alarm_mode: alarmMode } = await this.gladys.house.getBySelector(house.selector);
    const state = alarmModeToSecuritySystemState[alarmMode];

    // A mode this bridge does not know about is reported as disarmed rather than as an alarm going
    // off: announcing a break-in that is not happening is the worse of the two mistakes.
    return state === undefined ? HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED : state;
  };

  service
    .getCharacteristic(Characteristic.SecuritySystemCurrentState)
    .on(CharacteristicEventTypes.GET, async (callback) => {
      try {
        callback(undefined, await readState());
      } catch (e) {
        // Answering the failure rather than saying nothing: a callback that is never called leaves
        // the HAP request hanging until it times out.
        callback(e);
      }
    });

  // HomeKit has no triggered target, so a house that went off has to keep the target it was armed
  // with — reporting disarmed there would show the alarm as switched off while it rings. Gladys
  // does not record which mode preceded the panic, so it is remembered here. A bridge restart
  // forgets it, and away is then the assumption: it is the stricter of the two.
  let lastArmedTarget = HOMEKIT_SECURITY_SYSTEM_STATE.AWAY_ARM;

  const targetStateCharacteristic = service.getCharacteristic(Characteristic.SecuritySystemTargetState);
  targetStateCharacteristic.setProps({ validValues: SUPPORTED_TARGET_STATES });
  targetStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
    try {
      const state = await readState();

      if (state === HOMEKIT_SECURITY_SYSTEM_STATE.ALARM_TRIGGERED) {
        callback(undefined, lastArmedTarget);

        return;
      }

      if (state !== HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED) {
        lastArmedTarget = state;
      }
      callback(undefined, state);
    } catch (e) {
      callback(e);
    }
  });
  targetStateCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
    try {
      if (value === HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED) {
        await this.gladys.house.disarm(house.selector);
      } else if (value === HOMEKIT_SECURITY_SYSTEM_STATE.STAY_ARM) {
        await this.gladys.house.partialArm(house.selector);
      } else if (value === HOMEKIT_SECURITY_SYSTEM_STATE.AWAY_ARM) {
        await this.gladys.house.arm(house.selector);
      }

      // What the house is armed with is what it goes back to showing once the siren stops.
      if (value !== HOMEKIT_SECURITY_SYSTEM_STATE.DISARMED) {
        lastArmedTarget = value;
      }
      callback();
    } catch (e) {
      // Asking for the mode the house is already in throws a conflict, and the Home app does that
      // whenever two people press the same button. That one is answered as done: the house is in
      // the state that was asked for either way.
      if (e instanceof ConflictError) {
        logger.debug(`HomeKit: house ${house.selector} is already in the requested alarm mode`);
        callback();

        return;
      }

      // Anything else really failed, and must be reported as such. Answering a failed disarm with a
      // success would leave the Home app showing the alarm off while the house stays armed.
      logger.error(`HomeKit: could not set alarm mode of house ${house.selector}: ${e.message}`);
      callback(e);
    }
  });

  accessory.addService(service);

  return accessory;
}

module.exports = {
  buildAlarmAccessory,
  alarmModeToSecuritySystemState,
  HOMEKIT_SECURITY_SYSTEM_STATE,
  SUPPORTED_TARGET_STATES,
};
