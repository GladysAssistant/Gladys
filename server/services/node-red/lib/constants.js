const CONFIGURATION = {
  NODE_RED_USERNAME_VALUE: 'admin',
  NODE_RED_URL_VALUE: 'http://localhost:1880',

  NODE_RED_USERNAME: 'NODE_RED_USERNAME',
  NODE_RED_PASSWORD: 'NODE_RED_PASSWORD',
  NODE_RED_URL: 'NODE_RED_URL',

  DOCKER_NODE_RED_VERSION: 'DOCKER_NODE_RED_VERSION', // Variable to identify last version of NodeRed docker file is installed
};

const DEFAULT = {
  DOCKER_NODE_RED_VERSION: '2', // Last version of NodeRed docker file,
  CONFIGURATION_PATH: 'node-red/settings.js',
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
