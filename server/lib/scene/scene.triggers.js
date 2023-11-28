const { EVENTS } = require('../../utils/constants');
const { compare } = require('../../utils/compare');

const triggersFunc = {
  [EVENTS.DEVICE.NEW_STATE]: (event, trigger) => {
    // we check that we are talking about the same event
    if (event.device_feature !== trigger.device_feature) {
      return false;
    }
    const newValueValidateRule = compare(trigger.operator, event.last_value, trigger.value);
    // if the trigger is only a threshold_only, we only validate the trigger is the rule has been validated
    // and was not validated with the previous value
    if (trigger.threshold_only === true && !Number.isNaN(event.previous_value)) {
      const previousValueValidateRule = compare(trigger.operator, event.previous_value, trigger.value);
      return newValueValidateRule && !previousValueValidateRule;
    }
    return newValueValidateRule;
  },
  [EVENTS.TIME.CHANGED]: (event, trigger) => event.key === trigger.key,
  [EVENTS.TIME.SUNRISE]: (event, trigger) => event.house.selector === trigger.house,
  [EVENTS.TIME.SUNSET]: (event, trigger) => event.house.selector === trigger.house,
  [EVENTS.USER_PRESENCE.BACK_HOME]: (event, trigger) => event.house === trigger.house && event.user === trigger.user,
  [EVENTS.USER_PRESENCE.LEFT_HOME]: (event, trigger) => event.house === trigger.house && event.user === trigger.user,
  [EVENTS.HOUSE.EMPTY]: (event, trigger) => event.house === trigger.house,
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: (event, trigger) => event.house === trigger.house,
  [EVENTS.AREA.USER_ENTERED]: (event, trigger) => event.user === trigger.user && event.area === trigger.area,
  [EVENTS.AREA.USER_LEFT]: (event, trigger) => event.user === trigger.user && event.area === trigger.area,
  [EVENTS.ALARM.ARM]: (event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.ARMING]: (event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.DISARM]: (event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.PARTIAL_ARM]: (event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.PANIC]: (event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: (event, trigger) => event.house === trigger.house,
  [EVENTS.SYSTEM.START]: () => true,
  [EVENTS.MQTT.RECEIVED]: (event, trigger) =>
    event.topic === trigger.topic && (trigger.message === '' || trigger.message === event.message),
};

module.exports = {
  triggersFunc,
};
