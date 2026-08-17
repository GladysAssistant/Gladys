const cloneDeep = require('lodash.clonedeep');

const logger = require('../../utils/logger');
const { EVENTS, WEATHER_TRIGGER_FIELDS } = require('../../utils/constants');
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

// How each watched property of a weather trigger is read in a pivot
// weather payload. The core always polls in metric units, so the compared
// values are °C, % and the pivot condition enum as-is. The pivot wind
// speed is in m/s: it is converted to km/h, the unit the dashboard widget
// displays and the one users configure their scenes with.
// The numbers are compared **as the widget displays them** (Math.round,
// like WeatherBox): a user writes a rule from what they read on their
// dashboard, so 5.55 m/s — shown as 20 km/h — must match `>= 20` instead
// of silently comparing 19.98.
const WEATHER_TRIGGER_VALUE_GETTERS = {
  [WEATHER_TRIGGER_FIELDS.TEMPERATURE]: (weather) =>
    typeof weather.temperature === 'number' ? Math.round(weather.temperature) : undefined,
  [WEATHER_TRIGGER_FIELDS.HUMIDITY]: (weather) =>
    typeof weather.humidity === 'number' ? Math.round(weather.humidity) : undefined,
  [WEATHER_TRIGGER_FIELDS.WIND_SPEED]: (weather) =>
    typeof weather.wind_speed === 'number' ? Math.round(weather.wind_speed * 3.6) : undefined,
  [WEATHER_TRIGGER_FIELDS.CONDITION]: (weather) => weather.weather,
};

// undefined when there is no payload (first poll of the house) or when the
// provider does not expose the watched property (everything but the
// temperature and the condition is optional in the pivot format)
const getWeatherTriggerValue = (weather, field) => {
  const getter = WEATHER_TRIGGER_VALUE_GETTERS[field];
  if (weather === undefined || weather === null || getter === undefined) {
    return undefined;
  }
  return getter(weather);
};

// Same house, and the watched property matches the rule *now* while it did
// not at the previous poll: the trigger is a transition, so a scene does
// not re-run every poll for as long as it keeps raining. The event carries
// both payloads, so the matcher stays stateless and editing a scene never
// resets anything.
const matchWeather = (self, sceneSelector, event, trigger) => {
  if (event.house !== trigger.house) {
    return false;
  }
  // the condition is compared as a string of the pivot enum, everything
  // else as a number — a value left empty in the UI never matches.
  // The threshold is put on the same integer grid as the observed value:
  // a value stored by an imperial editor is a converted float (20 mph =
  // 32.1868 km/h, 70 °F = 21.111 °C), and comparing it against the rounded
  // 32 km/h / 21 °C the dashboard displays would miss the rule the user
  // copied from their widget.
  const isCondition = trigger.weather_field === WEATHER_TRIGGER_FIELDS.CONDITION;
  const expectedValue = isCondition ? trigger.value : Math.round(Number(trigger.value));
  if (!isCondition && Number.isNaN(expectedValue)) {
    return false;
  }
  const currentValue = getWeatherTriggerValue(event.weather, trigger.weather_field);
  if (currentValue === undefined || currentValue === null) {
    return false;
  }
  const previousValue = getWeatherTriggerValue(event.previous_weather, trigger.weather_field);
  const previousValueValidateRule =
    previousValue !== undefined && previousValue !== null && compare(trigger.operator, previousValue, expectedValue);
  return compare(trigger.operator, currentValue, expectedValue) && !previousValueValidateRule;
};

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
  [EVENTS.WEATHER.MATCHED]: matchWeather,
};

module.exports = {
  triggersFunc,
};
