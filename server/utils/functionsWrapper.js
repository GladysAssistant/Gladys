const logger = require('./logger');

/**
 * @description Wrap a function used to receive an event in a try catch with logging.
 * @param {Function} func - The function to wrap.
 * @returns {Function} Return wrap function.
 * @example
 * eventFunctionWrapper(this.add);
 */
function eventFunctionWrapper(func) {
  return async (...args) => {
    try {
      await func(...args);
    } catch (error) {
      logger.warn(`Error while executing ${func}`);
      logger.warn(error);
    }
  };
}

module.exports = {
  eventFunctionWrapper,
};
