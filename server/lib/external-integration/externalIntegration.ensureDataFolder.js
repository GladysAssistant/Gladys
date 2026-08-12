const fs = require('fs');

const logger = require('../../utils/logger');
const { INTEGRATION_DATA_UID, INTEGRATION_DATA_GID } = require('./constants');

/**
 * @description Prepare the /data host folder of an external integration
 * before its container is created. Docker creates a missing bind source
 * itself, but owned by root:root — and the integration image runs as the
 * unprivileged `node` user (USER node in the template), which left /data,
 * the only writable path of the container, read-only for the integration.
 * Creating the folder first and handing it to uid 1000 fixes new installs
 * and repairs existing ones at the next container recreation.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise} Resolve when the folder is ready.
 * @example
 * await gladys.externalIntegration.ensureDataFolder(service);
 */
async function ensureDataFolder(service) {
  const { basePathOnContainer } = await this.system.getGladysBasePath();
  const dataFolder = `${basePathOnContainer}/external-integrations/${service.selector}`;
  try {
    await fs.promises.mkdir(dataFolder, { recursive: true });
    await fs.promises.chown(dataFolder, INTEGRATION_DATA_UID, INTEGRATION_DATA_GID);
  } catch (e) {
    // best effort: Gladys running as an unprivileged host process cannot
    // chown to another user — the container is still created and Docker
    // creates the missing bind source itself, as before
    logger.warn(`Unable to prepare the data folder of integration ${service.selector}`, e);
  }
}

module.exports = {
  ensureDataFolder,
};
