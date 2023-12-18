---
to: ./services/<%= module %>/lib/device/<%= module %>.discover.js
---
const logger = require('../../../../utils/logger');

/**
 * @description Discover <%= className %> devices.
 * @returns {any} Null.
 * @example
 * <%= module %>.discover();
 */
function discover() {
  logger.debug(`<%= className %>: Discovering`);
  return null;
}

module.exports = {
  discover,
};
