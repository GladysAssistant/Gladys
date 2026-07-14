const { NotFoundError } = require('../../utils/coreErrors');
const { demuxDockerLogs } = require('../system/system.getGladysLogs');

const DEFAULT_LOG_LINES = 200;
const MAX_LOG_LINES = 5000;

/**
 * @description Get the logs of an external integration. The integration
 * simply writes on stdout/stderr and Gladys reads the logs on demand through
 * the Docker API (equivalent to `docker logs`) — no log table, no log push.
 * @param {string} selector - The selector of the external integration.
 * @param {number} [lines] - Number of log lines to return.
 * @returns {Promise<string>} Resolve with the raw logs.
 * @example
 * const logs = await gladys.externalIntegration.getLogs('ext-dev-my-integration', 200);
 */
async function getLogs(selector, lines = DEFAULT_LOG_LINES) {
  const service = await this.getBySelector(selector);
  if (!service.container_id) {
    throw new NotFoundError('EXTERNAL_INTEGRATION_HAS_NO_CONTAINER');
  }
  const safeLines = Math.min(MAX_LOG_LINES, Math.max(1, parseInt(lines, 10) || DEFAULT_LOG_LINES));
  const rawLogs = await this.system.getContainerLogs(service.container_id, {
    follow: false,
    tail: safeLines,
  });
  const buffer = Buffer.isBuffer(rawLogs) ? rawLogs : Buffer.from(String(rawLogs || ''));
  return demuxDockerLogs(buffer).toString('utf8');
}

module.exports = {
  getLogs,
};
