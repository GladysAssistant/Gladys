const CONFIGURATION = {
  MATTERBRIDGE_PORT_VALUE: '8283',
  MATTERBRIDGE_PORT: 'MATTERBRIDGE_PORT',
  MATTERBRIDGE_ENABLED: 'MATTERBRIDGE_ENABLED',
  DOCKER_MATTERBRIDGE_VERSION: 'DOCKER_MATTERBRIDGE_VERSION',
};

const DEFAULT = {
  DOCKER_MATTERBRIDGE_VERSION: '1',
  CONFIGURATION_PATH: 'matterbridge',
};

// Error messages the setup page explains with a message of its own.
const ERRORS = {
  // The Matter bridge of Gladys is turned on: it uses the Matter port Matterbridge needs.
  MATTER_BRIDGE_ENABLED: 'MATTER_BRIDGE_ENABLED',
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
  ERRORS,
};
