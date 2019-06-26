const { verifyTrigger } = require('./trigger.verifyTrigger');
const logger = require('../../utils/logger');

/**
 * @description Handle a new event
 * @param {string} type - The type of the event.
 * @param {Object} [event] - The event object.
 * @example
 * handleEvent('sun.sunrise');
 */
function handleEvent(type, event) {
  try {
    if (this.triggerDictionnary[type]) {
      // foreach trigger in our dictionnat for this type, we check if all conditions are verified
      this.triggerDictionnary[type].forEach((trigger) => {
        const triggerValid = verifyTrigger(this.stateManager, type, trigger, event);
        if (triggerValid) {
          // execute scenes
        }
      });
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  handleEvent,
};
