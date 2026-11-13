import get from 'get-value';

import { ACTIONS, EVENTS } from '../../../../../server/utils/constants';
import { isWildcardValue } from './sceneIntegrations';
import getDeviceFeatureValueOptions from '../../../utils/deviceFeatureValueOptions';
import { getDeviceFeatureName } from '../../../utils/device';

const truncate = (text, maxLength = 60) => {
  if (typeof text !== 'string') {
    return null;
  }
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
};

const joinParts = parts => {
  const filtered = parts.filter(part => part !== null && part !== undefined && part !== '');
  return filtered.length > 0 ? filtered.join(' · ') : null;
};

// The filled parameters of an integration-declared step ("camera: front,
// label: person, car"), the wildcards left out
const listDeclaredFields = fields => {
  if (!fields || typeof fields !== 'object') {
    return null;
  }
  const parts = Object.keys(fields)
    .filter(key => !isWildcardValue(fields[key]))
    .map(key => `${key}: ${Array.isArray(fields[key]) ? fields[key].join(', ') : fields[key]}`);
  return parts.length > 0 ? truncate(parts.join(' · ')) : null;
};

const listSelectors = selectors => {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    return null;
  }
  return truncate(selectors.join(', '));
};

// What a selector stands for — the first name of a user, the name of a house, a scene, a
// calendar or an area — once the editor has loaded it (names.users, names.houses…: selector ->
// name), the raw selector until then (or if it was deleted)
const nameOf = (names, kind, selector) => {
  if (selector === undefined || selector === null || selector === '') {
    return null;
  }
  const map = names && names[kind];
  return (map && map[selector]) || selector;
};

const listNames = (names, kind, selectors) => {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    return null;
  }
  return truncate(selectors.map(selector => nameOf(names, kind, selector)).join(', '));
};

// The label of a scene variable ("0.0.last_value" -> "Living room sensor (Temperature)"), as the
// step that exposes it declared it (names.variables: step path -> [{ name, label }], and
// names.triggersVariables for "triggerEvent.…"). The reference itself when nothing declares it.
const getVariableLabel = (reference, names) => {
  if (typeof reference !== 'string' || !names) {
    return reference;
  }
  const key = reference.trim();
  if (key.startsWith('triggerEvent.')) {
    const name = key.slice('triggerEvent.'.length);
    const declared = (names.triggersVariables || [])
      .reduce((all, triggerVariables) => all.concat(triggerVariables || []), [])
      .find(variable => variable.name === name);
    return declared && declared.label ? declared.label : reference;
  }
  const variables = names.variables || {};
  // a variable name may hold dots too: the longest step path that prefixes the reference wins
  const path = Object.keys(variables)
    .filter(candidate => key.startsWith(`${candidate}.`))
    .sort((a, b) => b.length - a.length)[0];
  if (path === undefined) {
    return reference;
  }
  const name = key.slice(path.length + 1);
  const declared = (variables[path] || []).find(variable => variable.name === name);
  return declared && declared.label ? declared.label : reference;
};

// A text typed with variables reads with their labels: "It is [Living room sensor (Temperature)] °C"
const VARIABLE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;
const nameVariablesInText = (text, names) => {
  if (typeof text !== 'string') {
    return text;
  }
  return text.replace(VARIABLE_PATTERN, (match, reference) => {
    const label = getVariableLabel(reference, names);
    return label === reference ? match : `[${label}]`;
  });
};

const OPERATOR_SYMBOLS = { '!=': '≠', '>=': '≥', '<=': '≤' };
const formatOperator = operator => OPERATOR_SYMBOLS[operator] || operator;

// A value compared with or sent to a feature: the label of a constant ("Open") or the number with
// its unit ("18 °C") once the feature is known, the raw value until then
const formatFeatureValue = (value, feature, dictionary) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const label = String(value);
  if (!feature) {
    return label;
  }
  const valueOption = (getDeviceFeatureValueOptions(dictionary, feature) || []).find(
    option => `${option.value}` === label
  );
  if (valueOption) {
    return valueOption.label;
  }
  const unit = feature.unit ? get(dictionary, `deviceFeatureUnitShort.${feature.unit}`) : null;
  return unit ? `${label} ${unit}` : label;
};

// The device name of a feature selector once the devices are loaded, the raw
// selector until then (or if the feature was deleted)
const getFeatureLabel = (selector, dictionary, deviceFeatures) => {
  const { device, feature } = (deviceFeatures && deviceFeatures[selector]) || {};
  return truncate(device ? getDeviceFeatureName(dictionary, device, feature) : selector);
};

// The device names of device selectors once the devices are loaded, the raw
// selector until then (or if the device was deleted)
const listDeviceNames = (selectors, deviceFeatures) => {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    return null;
  }
  const entries = deviceFeatures ? Object.values(deviceFeatures) : [];
  const names = selectors.map(selector => {
    const entry = entries.find(({ device }) => device.selector === selector);
    return entry ? entry.device.name : selector;
  });
  return truncate(names.join(', '));
};

// Builds a short human-readable summary of a configured action, displayed when
// its card is collapsed. Returns null when there is nothing meaningful to show:
// the card then only displays the action type label. deviceFeatures maps a
// feature selector to its { device, feature }, and thermostatSchedules a
// schedule selector to its name, both null while loading. names holds what the
// other selectors stand for (users, houses, scenes, calendars, areas) and the
// variables of the scene (variables, triggersVariables): a summary never shows
// an identifier when its name is known (docs/specs/scene-editor-mobile.md, C.1).
const getActionSummary = (action, dictionary, deviceFeatures, thermostatSchedules, names) => {
  if (!action || !action.type) {
    return null;
  }
  switch (action.type) {
    case ACTIONS.TIME.DELAY: {
      if (action.evaluate_value) {
        return truncate(nameVariablesInText(String(action.evaluate_value), names));
      }
      if (action.value === undefined || action.value === null || action.value === '') {
        return null;
      }
      const unitLabel = action.unit ? get(dictionary, `editScene.actionsCard.delay.${action.unit}`) : null;
      return joinParts([`${action.value} ${unitLabel || action.unit || ''}`.trim()]);
    }
    case ACTIONS.MESSAGE.SEND:
    case ACTIONS.MESSAGE.SEND_CAMERA:
    case ACTIONS.SMS.SEND:
    case ACTIONS.AI.ASK:
      return joinParts([nameOf(names, 'users', action.user), truncate(nameVariablesInText(action.text, names))]);
    case ACTIONS.MUSIC.PLAY_NOTIFICATION:
      return joinParts([
        action.device ? listDeviceNames([action.device], deviceFeatures) : null,
        truncate(nameVariablesInText(action.text, names))
      ]);
    case ACTIONS.MUSIC.PLAY_MEDIA:
      return joinParts([
        action.device ? listDeviceNames([action.device], deviceFeatures) : null,
        action.media ? truncate(action.media.title || action.media.id) : null
      ]);
    case ACTIONS.MQTT.SEND:
    case ACTIONS.ZIGBEE2MQTT.SEND:
      return truncate(action.topic);
    case ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION:
      return listDeclaredFields(action.fields);
    case ACTIONS.HTTP.REQUEST:
      return joinParts([action.method ? String(action.method).toUpperCase() : null, truncate(action.url)]);
    case ACTIONS.SCENE.START:
      return truncate(nameOf(names, 'scenes', action.scene));
    case ACTIONS.VARIABLE.SET:
      return truncate(action.name);
    case ACTIONS.ALARM.SET_ALARM_MODE:
    case ACTIONS.ALARM.CHECK_ALARM_MODE:
      return joinParts([
        nameOf(names, 'houses', action.house),
        action.alarm_mode ? get(dictionary, `alarmModes.${action.alarm_mode}`) || action.alarm_mode : null
      ]);
    case ACTIONS.HOUSE.IS_EMPTY:
    case ACTIONS.HOUSE.IS_NOT_EMPTY:
      return truncate(nameOf(names, 'houses', action.house));
    case ACTIONS.USER.SET_SEEN_AT_HOME:
    case ACTIONS.USER.SET_OUT_OF_HOME:
    case ACTIONS.USER.CHECK_PRESENCE:
      return joinParts([nameOf(names, 'users', action.user), nameOf(names, 'houses', action.house)]);
    case ACTIONS.DEVICE.GET_VALUE:
      return getFeatureLabel(action.device_feature, dictionary, deviceFeatures);
    case ACTIONS.DEVICE.SET_VALUE: {
      const hasEvaluateValue =
        action.evaluate_value !== undefined && action.evaluate_value !== null && action.evaluate_value !== '';
      // Until the devices are loaded (or if the feature was deleted), the raw selector and value are shown
      const { feature } = (deviceFeatures && deviceFeatures[action.device_feature]) || {};
      const valueLabel = hasEvaluateValue
        ? nameVariablesInText(String(action.evaluate_value), names)
        : formatFeatureValue(action.value, feature, dictionary);
      return joinParts([
        getFeatureLabel(action.device_feature, dictionary, deviceFeatures),
        valueLabel !== null ? truncate(valueLabel, hasEvaluateValue ? 40 : 20) : null
      ]);
    }
    case ACTIONS.LIGHT.TURN_ON:
    case ACTIONS.LIGHT.TURN_OFF:
    case ACTIONS.LIGHT.TOGGLE:
    case ACTIONS.LIGHT.BLINK:
      // device selectors: named once the devices are loaded
      return listDeviceNames(action.devices, deviceFeatures);
    case ACTIONS.SWITCH.TURN_ON:
    case ACTIONS.SWITCH.TURN_OFF:
    case ACTIONS.SWITCH.TOGGLE:
      return action.devices ? listDeviceNames(action.devices, deviceFeatures) : listSelectors(action.device_features);
    case ACTIONS.THERMOSTAT.SET_SCHEDULE:
      // A schedule selector is a slug plus a timestamp plus a random suffix
      // (school-holidays-1792941482500-tk5w): its name reads.
      return joinParts([
        truncate((thermostatSchedules && thermostatSchedules[action.schedule]) || action.schedule),
        listDeviceNames(action.devices, deviceFeatures)
      ]);
    case ACTIONS.CONDITION.ONLY_CONTINUE_IF: {
      if (!Array.isArray(action.conditions) || action.conditions.length === 0) {
        return null;
      }
      const [first] = action.conditions;
      const hasEvaluateValue =
        first.evaluate_value !== undefined && first.evaluate_value !== null && first.evaluate_value !== '';
      const value = hasEvaluateValue ? nameVariablesInText(String(first.evaluate_value), names) : first.value;
      const firstText = [getVariableLabel(first.variable, names), formatOperator(first.operator), value]
        .filter(part => part !== null && part !== undefined && part !== '')
        .join(' ');
      return joinParts([truncate(firstText), action.conditions.length > 1 ? `+${action.conditions.length - 1}` : null]);
    }
    case ACTIONS.CALENDAR.IS_EVENT_RUNNING:
      return joinParts([listNames(names, 'calendars', action.calendars), truncate(action.calendar_event_name)]);
    case ACTIONS.CALENDAR.GET_EVENTS: {
      let timeRange = null;
      if (action.time_range === 'today' || action.time_range === 'tomorrow') {
        timeRange =
          get(dictionary, `editScene.actionsCard.calendarGetEvents.${action.time_range}`) || action.time_range;
      } else if (action.time_range === 'next-x-hours') {
        const label = get(dictionary, 'editScene.actionsCard.calendarGetEvents.nextXHours') || action.time_range;
        timeRange = action.duration ? label.replace('X', String(action.duration)) : label;
      }
      return joinParts([
        listNames(names, 'calendars', action.calendars),
        truncate(action.calendar_event_name),
        timeRange
      ]);
    }
    case ACTIONS.ECOWATT.CONDITION:
      if (!action.ecowatt_network_status) {
        return null;
      }
      return (
        get(dictionary, `editScene.actionsCard.ecowattCondition.${action.ecowatt_network_status}`) ||
        action.ecowatt_network_status
      );
    case ACTIONS.EDF_TEMPO.CONDITION: {
      const tempoLabel = key => get(dictionary, `editScene.actionsCard.edfTempoCondition.${key}`) || key;
      const peakDayKeys = { blue: 'blueDay', white: 'whiteDay', red: 'redDay' };
      const peakHourKeys = { 'peak-hour': 'peakHour', 'off-peak-hour': 'offPeakHour' };
      return joinParts([
        action.edf_tempo_day ? tempoLabel(action.edf_tempo_day) : null,
        peakDayKeys[action.edf_tempo_peak_day_type] ? tempoLabel(peakDayKeys[action.edf_tempo_peak_day_type]) : null,
        // The peak hour check only applies to the current day: the editor hides
        // (but keeps) the field when the step targets tomorrow
        action.edf_tempo_day === 'today' && peakHourKeys[action.edf_tempo_peak_hour_type]
          ? tempoLabel(peakHourKeys[action.edf_tempo_peak_hour_type])
          : null
      ]);
    }
    case ACTIONS.ENERGY_CONTRACT.CURRENT_PRICE:
      return joinParts([
        truncate(action.energy_contract),
        action.operator && action.value !== undefined && action.value !== null && action.value !== ''
          ? `${formatOperator(action.operator)} ${action.value}`
          : null
      ]);
    case ACTIONS.CONDITION.CHECK_TIME: {
      const days = Array.isArray(action.days_of_the_week)
        ? action.days_of_the_week
            .map(day => get(dictionary, `editScene.triggersCard.scheduledTrigger.daysOfTheWeek.${day}`) || day)
            .join(', ')
        : null;
      return joinParts([action.after ? `≥ ${action.after}` : null, action.before ? `≤ ${action.before}` : null, days]);
    }
    default:
      return null;
  }
};

// Builds a short human-readable summary of a configured trigger, displayed when
// its card is collapsed. deviceFeatures and names: as for getActionSummary.
const getTriggerSummary = (trigger, dictionary, deviceFeatures, names) => {
  if (!trigger || !trigger.type) {
    return null;
  }
  const translateDays = days =>
    Array.isArray(days)
      ? days
          .map(day => get(dictionary, `editScene.triggersCard.scheduledTrigger.daysOfTheWeek.${day}`) || day)
          .join(', ')
      : null;
  switch (trigger.type) {
    case EVENTS.DEVICE.NEW_STATE: {
      let selectors = [];
      if (Array.isArray(trigger.device_features) && trigger.device_features.length > 0) {
        selectors = trigger.device_features;
      } else if (trigger.device_feature) {
        selectors = [trigger.device_feature];
      }
      // the features of a trigger are of the same kind: the first one tells how the value reads
      const { feature } = (deviceFeatures && deviceFeatures[selectors[0]]) || {};
      const value = formatFeatureValue(trigger.value, feature, dictionary);
      return joinParts([
        selectors.length > 0
          ? truncate(
              selectors
                .map(selector => {
                  // several features of one kind: the device names tell them apart, the kind
                  // would only be repeated
                  const { device } = (deviceFeatures && deviceFeatures[selector]) || {};
                  return selectors.length > 1 && device
                    ? device.name
                    : getFeatureLabel(selector, dictionary, deviceFeatures);
                })
                .join(', '),
              80
            )
          : null,
        trigger.operator && value !== null ? `${formatOperator(trigger.operator)} ${value}` : null
      ]);
    }
    case EVENTS.TIME.CHANGED:
      if (trigger.scheduler_type === 'time-range') {
        // The days alone said nothing of the planning itself.
        const ranges = (trigger.time_ranges || [])
          .filter(range => range.start && range.end)
          .map(range => `${range.start}–${range.end}`)
          .join(', ');
        return joinParts([truncate(ranges), translateDays(trigger.days_of_the_week)]);
      }
      return joinParts([
        trigger.time,
        trigger.date,
        translateDays(trigger.days_of_the_week),
        trigger.interval && trigger.unit ? `${trigger.interval} ${trigger.unit}` : null
      ]);
    case EVENTS.TIME.SUNRISE:
    case EVENTS.TIME.SUNSET:
      return truncate(nameOf(names, 'houses', trigger.house));
    case EVENTS.CALENDAR.EVENT_IS_COMING:
      return joinParts([listNames(names, 'calendars', trigger.calendars), truncate(trigger.calendar_event_name)]);
    case EVENTS.USER_PRESENCE.BACK_HOME:
    case EVENTS.USER_PRESENCE.LEFT_HOME:
      return joinParts([nameOf(names, 'users', trigger.user), nameOf(names, 'houses', trigger.house)]);
    case EVENTS.HOUSE.EMPTY:
    case EVENTS.HOUSE.NO_LONGER_EMPTY:
      return truncate(nameOf(names, 'houses', trigger.house));
    case EVENTS.AREA.USER_ENTERED:
    case EVENTS.AREA.USER_LEFT:
      return joinParts([nameOf(names, 'users', trigger.user), nameOf(names, 'areas', trigger.area)]);
    case EVENTS.ALARM.ARM:
    case EVENTS.ALARM.ARMING:
    case EVENTS.ALARM.PARTIAL_ARM:
    case EVENTS.ALARM.DISARM:
    case EVENTS.ALARM.PANIC:
    case EVENTS.ALARM.TOO_MANY_CODES_TESTS:
      return truncate(nameOf(names, 'houses', trigger.house));
    case EVENTS.MQTT.RECEIVED:
      return truncate(trigger.topic);
    case EVENTS.WEATHER.ALERT_RAISED:
    case EVENTS.WEATHER.ALERT_ENDED:
      return joinParts([nameOf(names, 'houses', trigger.house), trigger.weather_alert_type]);
    case EVENTS.ENERGY_CONTRACT.PRICE_CHANGED:
      return truncate(trigger.energy_contract);
    case EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT:
      return listDeclaredFields(trigger.fields);
    default:
      return null;
  }
};

export { getActionSummary, getTriggerSummary };
