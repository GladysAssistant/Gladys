const { triggersFunc } = require('./scene.triggers');
const logger = require('../../utils/logger');

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
          const conditionVerified = triggersFunc[event.type](event, trigger);
          logger.debug(`Trigger ${trigger.type}, conditionVerified = ${conditionVerified}...`);

          // if yes, we execute the scene
          if (conditionVerified) {
            this.execute(sceneSelector, {
              triggerEvent: event,
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
