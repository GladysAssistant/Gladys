---
to: ./services/<%= module %>/lib/commands/<%= module %>.start.js
---
const logger = require('../../../../utils/logger');

/**
 * @description Initialize <%= className %> service with dependencies.
 * @returns {any} Null.
 * @example
 * <%= module %>.start();
 */
function start() {
  logger.debug(`<%= className %>: Starting`);
  return null;
}

module.exports = {
  start,
};
