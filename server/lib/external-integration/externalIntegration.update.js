const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Update an external integration: resolve the latest manifest
 * (from the store index by store_slug, or directly from the repo), pull the
 * new image and recreate the container (which rotates the integration token:
 * the previous JWT is instantly invalidated). For dev installs without a
 * store_slug, the current image tag is re-pulled. Updates are an explicit
 * admin gesture — no auto-update in v1.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the updated integration.
 * @example
 * await gladys.externalIntegration.update('ext-john-gladys-open-meteo-demo');
 */
async function update(selector) {
  let service = await this.getBySelector(selector);
  if (!this.available) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  let { manifest } = service;
  if (service.store_slug) {
    const index = await this.getIndex();
    const entry = ((index && index.integrations) || []).find(
      (indexEntry) => indexEntry.store_slug === service.store_slug,
    );
    if (entry) {
      manifest = entry.manifest;
    } else {
      try {
        manifest = await this.fetchManifestFromRepo(service.store_slug);
      } catch (e) {
        logger.warn(`Unable to fetch latest manifest of ${service.store_slug}, re-pulling current image`, e);
      }
    }
    this.validateManifest(manifest);
  }
  const image = (manifest && manifest.docker_image) || service.docker_image;
  try {
    await this.system.pull(image);
  } catch (e) {
    logger.warn(`Unable to pull image ${image}`, e);
    throw new BadParameters(`UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`);
  }
  await Promise.each((manifest && manifest.containers) || [], async (entry) => {
    try {
      await this.system.pull(entry.docker_image);
    } catch (e) {
      logger.warn(`Unable to pull image ${entry.docker_image}`, e);
      throw new BadParameters(
        `UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`,
      );
    }
  });
  if (service.container_id) {
    try {
      await this.system.stopContainer(service.container_id);
    } catch (e) {
      logger.debug(e);
    }
  }
  // update = recreation of the whole group according to the new manifest:
  // the sub-containers of the OLD manifest are removed (the private network
  // and the /data volumes stay), the new ones are recreated at start
  try {
    await this.removeSubContainers(service, { removeNetwork: false });
  } catch (e) {
    logger.warn(`Unable to remove sub-containers of integration ${selector} before update`, e);
  }
  await db.Service.update({ version: manifest.version, manifest, docker_image: image }, { where: { id: service.id } });
  service = await this.getBySelector(selector);
  await this.createIntegrationContainer(service);
  return this.start(selector);
}

module.exports = {
  update,
};
