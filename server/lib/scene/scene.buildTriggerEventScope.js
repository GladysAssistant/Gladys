const cloneDeep = require('lodash.clonedeep');

const { EVENTS } = require('../../utils/constants');

/**
 * @description Enrich a trigger event with human-readable data for use in scene variables.
 * @param {object} event - The raw trigger event.
 * @param {object} stateManager - The Gladys state manager.
 * @returns {object} The enriched trigger event.
 * @example
 * buildTriggerEventScope({ type: 'device.new-state', device_feature: 'door-sensor' }, stateManager);
 */
function buildTriggerEventScope(event, stateManager) {
  const triggerEvent = cloneDeep(event);

  switch (event.type) {
    case EVENTS.DEVICE.NEW_STATE: {
      const deviceFeature = stateManager.get('deviceFeature', event.device_feature);
      if (deviceFeature) {
        triggerEvent.deviceFeature = cloneDeep({
          selector: deviceFeature.selector,
          name: deviceFeature.name,
          category: deviceFeature.category,
          type: deviceFeature.type,
          unit: deviceFeature.unit,
          last_value: event.last_value,
          previous_value: event.previous_value,
          last_value_changed: event.last_value_changed,
        });
        const device = stateManager.get('deviceById', deviceFeature.device_id);
        if (device) {
          triggerEvent.device = cloneDeep({
            selector: device.selector,
            name: device.name,
          });
        }
      }
      break;
    }
    case EVENTS.USER_PRESENCE.BACK_HOME:
    case EVENTS.USER_PRESENCE.LEFT_HOME: {
      const user = stateManager.get('user', event.user);
      if (user) {
        triggerEvent.user = cloneDeep({
          selector: user.selector,
          firstname: user.firstname,
          lastname: user.lastname,
        });
      }
      const house = stateManager.get('house', event.house);
      if (house) {
        triggerEvent.house = cloneDeep({
          selector: house.selector,
          name: house.name,
        });
      }
      break;
    }
    case EVENTS.AREA.USER_ENTERED:
    case EVENTS.AREA.USER_LEFT: {
      const user = stateManager.get('user', event.user);
      if (user) {
        triggerEvent.user = cloneDeep({
          selector: user.selector,
          firstname: user.firstname,
          lastname: user.lastname,
        });
      }
      break;
    }
    default:
      break;
  }

  return triggerEvent;
}

module.exports = {
  buildTriggerEventScope,
};
