const { DEFAULT, NODE_RED_IMAGE_TAGS, NODE_RED_MAJOR_VERSIONS } = require('./constants');

/**
 * @description Check if a user already had Node-RED configured before.
 * @param {object} config - Node-RED configuration.
 * @returns {boolean} True when existing Node-RED data is present.
 * @example
 * isExistingNodeRedUser({ nodeRedUsername: 'admin' });
 */
function isExistingNodeRedUser(config) {
  return Boolean(config.nodeRedUsername || config.nodeRedPassword);
}

/**
 * @description Resolve the Node-RED major version to use.
 * @param {object} config - Node-RED configuration.
 * @returns {string} Node-RED major version.
 * @example
 * resolveNodeRedMajorVersion({ dockerNodeRedVersion: '5' });
 */
function resolveNodeRedMajorVersion(config) {
  const { dockerNodeRedVersion } = config;

  if (dockerNodeRedVersion && NODE_RED_MAJOR_VERSIONS.includes(dockerNodeRedVersion)) {
    return dockerNodeRedVersion;
  }

  if (isExistingNodeRedUser(config)) {
    return DEFAULT.NODE_RED_MAJOR_VERSION_EXISTING;
  }

  return DEFAULT.NODE_RED_MAJOR_VERSION_NEW;
}

/**
 * @description Get Docker image for a Node-RED major version.
 * @param {string} majorVersion - Node-RED major version.
 * @returns {string} Docker image reference.
 * @example
 * getNodeRedDockerImage('5');
 */
function getNodeRedDockerImage(majorVersion) {
  const imageTag = NODE_RED_IMAGE_TAGS[majorVersion];

  if (!imageTag) {
    throw new Error(`NODE_RED_INVALID_MAJOR_VERSION: ${majorVersion}`);
  }

  return `nodered/node-red:${imageTag}`;
}

/**
 * @description Check if a running container matches the selected major version.
 * @param {string} containerImage - Container image reference.
 * @param {string} majorVersion - Node-RED major version.
 * @returns {boolean} True when the container image matches the major version.
 * @example
 * containerMatchesMajorVersion('nodered/node-red:5.0', '5');
 */
function containerMatchesMajorVersion(containerImage, majorVersion) {
  const expectedImage = getNodeRedDockerImage(majorVersion);
  const expectedTag = expectedImage.split(':')[1];

  return containerImage === expectedImage || containerImage.endsWith(`:${expectedTag}`);
}

module.exports = {
  isExistingNodeRedUser,
  resolveNodeRedMajorVersion,
  getNodeRedDockerImage,
  containerMatchesMajorVersion,
};
