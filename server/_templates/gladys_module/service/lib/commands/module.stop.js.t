---
to: ./services/<%= module %>/lib/commands/<%= module %>.stop.js
---
const logger = require('../../../../utils/logger');

/**
 * @description Stops <%= className %> service.
 * @returns {any} Null.
 * @example
 * <%= module %>.stop();
 */
function stop() {
  logger.debug(`<%= className %>: Stopping`);
  return null;
}

module.exports = {
  stop,
};
