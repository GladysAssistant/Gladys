---
to: ./services/<%= module %>/lib/commands/<%= module %>.getStatus.js
---
const logger = require('../../../../utils/logger');

/**
 * @description Return <%= className %> service status.
 * @returns {any} Null.
 * @example
 * <%= module %>.getStatus();
 */
function getStatus() {
  logger.debug(`<%= className %>: status`);
  return null;
}

module.exports = {
  getStatus,
};
