const { triggersFunc } = require('./scene.triggers');
const { EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Enrich the trigger event with the related device & device feature,
 * so scene actions can know which device triggered the scene.
 * @param {object} self - SceneManager instance.
 * @param {object} event - The event to enrich.
 * @returns {object} The enriched event.
 * @example
 * enrichTriggerEvent(this, { type: 'device.new-state', device_feature: 'my-sensor', last_value: 1 });
 */
function enrichTriggerEvent(self, event) {
  if (event.type !== EVENTS.DEVICE.NEW_STATE) {
    return event;
  }
  const deviceFeature = self.stateManager.get('deviceFeature', event.device_feature);
  if (!deviceFeature) {
    return event;
  }
  const device = self.stateManager.get('deviceById', deviceFeature.device_id);
  return {
    ...event,
    deviceFeature: {
      selector: event.device_feature,
      name: deviceFeature.name,
    },
    device: device
      ? {
          selector: device.selector,
          name: device.name,
        }
      : undefined,
  };
}

/**
 * @description CheckTrigger verify if the current event verify
 * a trigger.
 * @param {object} event - The event to check.
 * @example
 * checkTrigger({ type: 'device.new-state' })
 */
function checkTrigger(event) {
  logger.debug(`Trigger: new event checkTrigger "${event.type}"`);
  if (!triggersFunc[event.type]) {
    throw new Error(`Trigger type "${event.type}" has no checker function.`);
  }
  const triggerEvent = enrichTriggerEvent(this, event);
  const sceneSelectors = Object.keys(this.scenes);

  // foreach scenes we have in RAM
  sceneSelectors.forEach((sceneSelector) => {
    // we check if the scene has triggers and is active
    if (
      this.scenes[sceneSelector].triggers &&
      this.scenes[sceneSelector].triggers instanceof Array &&
      this.scenes[sceneSelector].active
    ) {
      // if yes, we loop on each trigger
      this.scenes[sceneSelector].triggers.forEach((trigger) => {
        logger.debug(`Checking trigger ${trigger.type}...`);
        // we check that trigger type is matching the event
        if (event.type === trigger.type) {
          logger.debug(`Trigger ${trigger.type} is matching with event`);
          // then we check the condition is verified
          const conditionVerified = triggersFunc[event.type](this, sceneSelector, event, trigger);
          logger.debug(`Trigger ${trigger.type}, conditionVerified = ${conditionVerified}...`);

          // if yes, we execute the scene
          if (conditionVerified) {
            this.execute(sceneSelector, {
              triggerEvent,
            });
          }
        }
      });
    }
  });
}

module.exports = {
  checkTrigger,
};
