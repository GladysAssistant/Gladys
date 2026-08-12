const Promise = require('bluebird');
const fs = require('fs');

const logger = require('../../utils/logger');
const { INTEGRATION_DATA_UID, INTEGRATION_DATA_GID } = require('./constants');

/**
 * @description Prepare the bind sources of the declared volumes of a
 * sub-container before it is created. Auto-started sub-containers are
 * created BEFORE the main container (start, install): without this,
 * Docker would create the missing nested bind sources itself, owned by
 * root:root, and the main container (uid 1000) could not write its
 * config files under /data/containers/<name>/... — the documented
 * configuration channel of multi-container integrations. Each missing
 * folder is created and handed to uid 1000; an existing folder is only
 * repaired when still owned by root (a Docker-created one), never
 * re-chowned otherwise: a sub-container image may legitimately own its
 * data with another uid.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @returns {Promise} Resolve when the folders are ready.
 * @example
 * await gladys.externalIntegration.ensureSubContainerVolumes(service, entry);
 */
async function ensureSubContainerVolumes(service, entry) {
  await this.ensureDataFolder(service);
  const { basePathOnContainer } = await this.system.getGladysBasePath();
  const integrationFolder = `${basePathOnContainer}/external-integrations/${service.selector}`;
  try {
    await Promise.each(entry.volumes || [], async (volume) => {
      const segments = ['containers', entry.name, ...volume.split('/').filter((segment) => segment !== '')];
      let currentFolder = integrationFolder;
      await Promise.each(segments, async (segment) => {
        currentFolder = `${currentFolder}/${segment}`;
        try {
          await fs.promises.mkdir(currentFolder);
          await fs.promises.chown(currentFolder, INTEGRATION_DATA_UID, INTEGRATION_DATA_GID);
        } catch (e) {
          if (e.code !== 'EEXIST') {
            throw e;
          }
          const stats = await fs.promises.stat(currentFolder);
          if (stats.uid === 0) {
            await fs.promises.chown(currentFolder, INTEGRATION_DATA_UID, INTEGRATION_DATA_GID);
          }
        }
      });
    });
  } catch (e) {
    // best effort, same rationale as ensureDataFolder: the container is
    // still created and Docker creates the missing bind sources itself
    logger.warn(
      `Unable to prepare the volume folders of container ${entry.name} of integration ${service.selector}`,
      e,
    );
  }
}

module.exports = {
  ensureSubContainerVolumes,
};
