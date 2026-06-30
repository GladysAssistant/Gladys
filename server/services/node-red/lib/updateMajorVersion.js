const logger = require('../../../utils/logger');
const { CONFIGURATION, NODE_RED_MAJOR_VERSIONS } = require('./constants');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Update Node-RED major version and recreate container if needed.
 * @param {string} majorVersion - Node-RED major version.
 * @returns {Promise<object>} Updated Node-RED configuration.
 * @example
 * await nodeRed.updateMajorVersion('5');
 */
async function updateMajorVersion(majorVersion) {
  if (!NODE_RED_MAJOR_VERSIONS.includes(majorVersion)) {
    throw new NotFoundError('NODE_RED_INVALID_MAJOR_VERSION');
  }

  const storedMajorVersion = await this.gladys.variable.getValue(CONFIGURATION.DOCKER_NODE_RED_VERSION, this.serviceId);

  if (storedMajorVersion === majorVersion) {
    return this.getConfiguration();
  }

  const configuration = await this.getConfiguration();

  logger.info(
    `Node-RED: updating major version from ${storedMajorVersion ||
      configuration.dockerNodeRedVersion} to ${majorVersion}...`,
  );

  configuration.dockerNodeRedVersion = majorVersion;
  await this.saveConfiguration(configuration);

  if (await this.isEnabled()) {
    await this.checkForContainerUpdates(configuration);
    await this.installContainer(configuration);
  }

  return this.getConfiguration();
}

module.exports = {
  updateMajorVersion,
};
