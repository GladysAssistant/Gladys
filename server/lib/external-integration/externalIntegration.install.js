const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, ConflictError, PlatformNotCompatible } = require('../../utils/coreErrors');
const { Error422 } = require('../../utils/httpErrors');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../utils/constants');
const { MANIFEST_IMAGE_LABEL } = require('./constants');

/**
 * @description Install an external integration. The caller resolves the
 * install mode first: store install ({ manifest, storeSlug }), repo install
 * ({ manifest, storeSlug, repoUrl }) or dev install by image
 * ({ dockerImage [, manifest] }, the manifest being read from the image
 * labels when not provided).
 * @param {object} options - Install options.
 * @param {string} [options.dockerImage] - Docker image (dev install).
 * @param {object} [options.manifest] - The integration manifest.
 * @param {string} [options.storeSlug] - Store slug (`owner/repo`).
 * @returns {Promise<object>} Resolve with the installed integration.
 * @example
 * await gladys.externalIntegration.install({ dockerImage: 'my-image:1.0.0', manifest });
 */
async function install({ dockerImage, manifest, storeSlug = null }) {
  if (!this.available) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const image = dockerImage || (manifest && manifest.docker_image);
  if (!image) {
    throw new BadParameters('docker_image or manifest.docker_image is required');
  }
  if (storeSlug) {
    const existing = await db.Service.findOne({ where: { store_slug: storeSlug, type: SERVICE_TYPES.EXTERNAL } });
    if (existing !== null) {
      throw new ConflictError('EXTERNAL_INTEGRATION_ALREADY_INSTALLED');
    }
  }
  try {
    await this.system.pull(image);
  } catch (e) {
    logger.warn(`Unable to pull image ${image}`, e);
    // an amd64-only image on a Raspberry Pi fails here: explicit message, not a raw Docker error
    throw new BadParameters(`UNABLE_TO_PULL_IMAGE: image may not exist or may not be available for your architecture`);
  }
  let finalManifest = manifest;
  if (!finalManifest) {
    // dev install by image name without repo: the manifest is read from the image labels
    const labels = await this.system.getImageLabels(image);
    const rawManifest = labels[MANIFEST_IMAGE_LABEL];
    if (!rawManifest) {
      throw new Error422(`MANIFEST_NOT_FOUND: image has no ${MANIFEST_IMAGE_LABEL} label`);
    }
    try {
      finalManifest = JSON.parse(rawManifest);
    } catch (e) {
      throw new Error422(`INVALID_MANIFEST: ${MANIFEST_IMAGE_LABEL} label is not valid JSON`);
    }
  }
  this.validateManifest(finalManifest);
  const selector = await this.buildSelector({ storeSlug, manifestName: finalManifest.name });
  const existingSelector = await db.Service.findOne({ where: { selector } });
  if (existingSelector !== null) {
    throw new ConflictError('EXTERNAL_INTEGRATION_ALREADY_INSTALLED');
  }
  let createdService;
  try {
    createdService = await db.Service.create({
      name: selector,
      selector,
      version: finalManifest.version,
      has_message_feature: finalManifest.type === 'communication',
      status: SERVICE_STATUS.ENABLED,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: image,
      manifest: finalManifest,
      store_slug: storeSlug,
    });
  } catch (e) {
    // two concurrent installs can race between the findOne pre-check and
    // the create: translate the unique constraint on the selector
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError('EXTERNAL_INTEGRATION_ALREADY_INSTALLED');
    }
    throw e;
  }
  const service = createdService.get({ plain: true });
  this.registerProxyService(service);
  try {
    await this.createIntegrationContainer(service);
    await this.start(selector);
  } catch (e) {
    logger.warn(`Unable to start integration ${selector} after install`, e);
    await this.saveStatus(service, SERVICE_STATUS.ERROR);
  }
  return this.getBySelector(selector);
}

module.exports = {
  install,
};
