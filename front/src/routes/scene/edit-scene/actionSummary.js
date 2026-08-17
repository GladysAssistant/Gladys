import get from 'get-value';

import { ACTIONS } from '../../../../../server/utils/constants';

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

const listSelectors = selectors => {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    return null;
  }
  return truncate(selectors.join(', '));
};

// Builds a short human-readable summary of a configured action, displayed when
// its card is collapsed. Returns null when there is nothing meaningful to show:
// the card then only displays the action type label.
const getActionSummary = (action, dictionary) => {
  if (!action || !action.type) {
    return null;
  }
  switch (action.type) {
    case ACTIONS.TIME.DELAY: {
      if (action.evaluate_value) {
        return truncate(String(action.evaluate_value));
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
      return joinParts([action.user, truncate(action.text)]);
    case ACTIONS.MUSIC.PLAY_NOTIFICATION:
      return truncate(action.text);
    case ACTIONS.MQTT.SEND:
    case ACTIONS.ZIGBEE2MQTT.SEND:
      return truncate(action.topic);
    case ACTIONS.HTTP.REQUEST:
      return joinParts([action.method ? String(action.method).toUpperCase() : null, truncate(action.url)]);
    case ACTIONS.SCENE.START:
      return truncate(action.scene);
    case ACTIONS.VARIABLE.SET:
      return truncate(action.name);
    case ACTIONS.ALARM.SET_ALARM_MODE:
    case ACTIONS.ALARM.CHECK_ALARM_MODE:
      return joinParts([action.house, action.alarm_mode]);
    case ACTIONS.HOUSE.IS_EMPTY:
    case ACTIONS.HOUSE.IS_NOT_EMPTY:
      return truncate(action.house);
    case ACTIONS.USER.SET_SEEN_AT_HOME:
    case ACTIONS.USER.SET_OUT_OF_HOME:
    case ACTIONS.USER.CHECK_PRESENCE:
      return joinParts([action.user, action.house]);
    case ACTIONS.DEVICE.GET_VALUE:
      return truncate(action.device_feature);
    case ACTIONS.DEVICE.SET_VALUE: {
      const value =
        action.evaluate_value !== undefined && action.evaluate_value !== null && action.evaluate_value !== ''
          ? action.evaluate_value
          : action.value;
      return joinParts([
        truncate(action.device_feature),
        value !== undefined && value !== null && value !== '' ? truncate(String(value), 20) : null
      ]);
    }
    case ACTIONS.LIGHT.TURN_ON:
    case ACTIONS.LIGHT.TURN_OFF:
    case ACTIONS.LIGHT.TOGGLE:
    case ACTIONS.LIGHT.BLINK:
      return listSelectors(action.devices);
    case ACTIONS.SWITCH.TURN_ON:
    case ACTIONS.SWITCH.TURN_OFF:
    case ACTIONS.SWITCH.TOGGLE:
      return listSelectors(action.devices || action.device_features);
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

export { getActionSummary };
