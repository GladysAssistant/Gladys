const cloneDeep = require('lodash.clonedeep');

const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { compare } = require('../../utils/compare');

const matchSunEvent = (self, sceneSelector, event, trigger) =>
  event.house.selector === trigger.house && (event.offset || 0) === (trigger.offset || 0);

// severity scale of the generic weather alerts (B.18)
const WEATHER_ALERT_SEVERITY_RANK = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

// same house, phenomenon type filter ('any' or absent = every type),
// minimal severity (absent = minor, so every alert matches)
const matchWeatherAlert = (self, sceneSelector, event, trigger) =>
  event.house === trigger.house &&
  (!trigger.weather_alert_type ||
    trigger.weather_alert_type === 'any' ||
    event.alert.type === trigger.weather_alert_type) &&
  WEATHER_ALERT_SEVERITY_RANK[event.alert.severity] >=
    (WEATHER_ALERT_SEVERITY_RANK[trigger.weather_alert_severity] || 1);

const triggersFunc = {
  [EVENTS.DEVICE.NEW_STATE]: (self, sceneSelector, event, trigger) => {
    // Multi-select triggers store their features in `device_features`, legacy triggers
    // a single one in `device_feature`. The trigger matches as soon as the event concerns
    // one of the selected features (OR logic), so the rest of the check — including the
    // `for_duration` timer key — is scoped to the event's feature, keeping one independent
    // timer per selected feature. An empty array (rejected by validation but possible in
    // hand-edited data) falls back to the legacy field instead of never matching.
    const triggerDeviceFeatures =
      trigger.device_features && trigger.device_features.length > 0
        ? trigger.device_features
        : [trigger.device_feature];
    if (!triggerDeviceFeatures.includes(event.device_feature)) {
      return false;
    }

    // We verify if both old value and new value validate the rule
    const newValueValidateRule = compare(trigger.operator, event.last_value, trigger.value);
    const previousValueValidateRule = compare(trigger.operator, event.previous_value, trigger.value);

    const triggerDurationKey = `device.new-state.${sceneSelector}.${event.device_feature}:${trigger.operator}:${trigger.value}`;

    // If the previous value was validating the rule, and the new value is not
    // We clear any timeout for this trigger
    if (previousValueValidateRule && !newValueValidateRule && self.checkTriggersDurationTimer.get(triggerDurationKey)) {
      logger.info(
        `Cancelling timer on trigger for device_feature ${event.device_feature}, because condition is no longer valid`,
      );
      clearTimeout(self.checkTriggersDurationTimer.get(triggerDurationKey));
      self.checkTriggersDurationTimer.delete(triggerDurationKey);
    }

    if (trigger.for_duration === undefined) {
      // If the trigger is only a threshold_only, we only validate the trigger is the rule has been validated
      // and was not validated with the previous value
      if (trigger.threshold_only === true && !Number.isNaN(event.previous_value)) {
        return newValueValidateRule && !previousValueValidateRule;
      }

      return newValueValidateRule;
    }

    // If the "for_duration_finished" is here, it means we are
    // checking the state after the timeout
    if (event.for_duration_finished && triggerDurationKey === event.trigger_duration_key) {
      logger.info(`Scene trigger device.new-state: Timer for sensor ${event.device_feature} has finished.`);
      clearTimeout(self.checkTriggersDurationTimer.get(triggerDurationKey));
      self.checkTriggersDurationTimer.delete(triggerDurationKey);
      return newValueValidateRule;
    }

    const isValidatedIfThresholdOnly =
      trigger.threshold_only && !Number.isNaN(event.previous_value)
        ? newValueValidateRule && !previousValueValidateRule
        : true;

    if (newValueValidateRule && isValidatedIfThresholdOnly) {
      // If the timeout already exist, don't re-create it
      const timeoutAlreadyExist = self.checkTriggersDurationTimer.get(triggerDurationKey);
      if (timeoutAlreadyExist) {
        logger.info(`Timer for "${event.device_feature}" already exist, not re-creating.`);
        return false;
      }
      logger.info(
        `Scheduling timer to check for device_feature "${event.device_feature}" state in ${trigger.for_duration}ms`,
      );
      // Create a timeout
      const timeoutId = setTimeout(() => {
        const lastValue = self.stateManager.get('deviceFeature', event.device_feature).last_value;
        self.event.emit(EVENTS.TRIGGERS.CHECK, {
          ...cloneDeep(event),
          previous_value: event.last_value,
          last_value: lastValue,
          for_duration_finished: true,
          trigger_duration_key: triggerDurationKey,
        });
      }, trigger.for_duration);
      // Save the timeoutId in case we need to cancel it later
      self.checkTriggersDurationTimer.set(triggerDurationKey, timeoutId);
      // Return false, as we'll check this only in the future
      return false;
    }

    return false;
  },
  [EVENTS.TIME.CHANGED]: (self, sceneSelector, event, trigger) => event.key === trigger.key,
  [EVENTS.TIME.SUNRISE]: matchSunEvent,
  [EVENTS.TIME.SUNSET]: matchSunEvent,
  [EVENTS.USER_PRESENCE.BACK_HOME]: (self, sceneSelector, event, trigger) =>
    event.house === trigger.house && event.user === trigger.user,
  [EVENTS.USER_PRESENCE.LEFT_HOME]: (self, sceneSelector, event, trigger) =>
    event.house === trigger.house && event.user === trigger.user,
  [EVENTS.HOUSE.EMPTY]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.HOUSE.NO_LONGER_EMPTY]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.AREA.USER_ENTERED]: (self, sceneSelector, event, trigger) =>
    event.user === trigger.user && event.area === trigger.area,
  [EVENTS.AREA.USER_LEFT]: (self, sceneSelector, event, trigger) =>
    event.user === trigger.user && event.area === trigger.area,
  [EVENTS.ALARM.ARM]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.ARMING]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.DISARM]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.PARTIAL_ARM]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.PANIC]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.ALARM.TOO_MANY_CODES_TESTS]: (self, sceneSelector, event, trigger) => event.house === trigger.house,
  [EVENTS.SYSTEM.START]: () => true,
  [EVENTS.MQTT.RECEIVED]: (self, sceneSelector, event, trigger) =>
    event.topic === trigger.topic && (!trigger.message || trigger.message === event.message),
  [EVENTS.WEATHER.ALERT_RAISED]: matchWeatherAlert,
  [EVENTS.WEATHER.ALERT_ENDED]: matchWeatherAlert,
};

module.exports = {
  triggersFunc,
};
