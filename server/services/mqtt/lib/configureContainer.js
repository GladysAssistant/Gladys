const fs = require('fs/promises');
const { constants } = require('fs');
const os = require('os');

const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

const MOSQUITTO_DIRECTORY = '/var/lib/gladysassistant/mosquitto';
const MOSQUITTO_CONFIG_FILE_PATH = `${MOSQUITTO_DIRECTORY}/mosquitto.conf`;
const MOSQUITTO_PASSWORD_FILE_PATH = `${MOSQUITTO_DIRECTORY}/mosquitto.passwd`;

const LISTENER_LINE_REGEXP = /^listener .*/m;

/**
 * @description Configure MQTT container.
 * @param {number} [port] - Host port the mosquitto broker should listen on.
 * @example
 * mqtt.configureContainer(1883);
 */
async function configureContainer(port = DEFAULT.MOSQUITTO_DEFAULT_PORT) {
  logger.info('MQTT broker Docker container is being configured...');

  const listenerLine = `listener ${port}`;
  const configContentLines = [
    'allow_anonymous false',
    'connection_messages false',
    `password_file ${DEFAULT.PASSWORD_FILE_PATH}`,
    listenerLine,
  ];

  // Create configuration path (if not exists)
  await fs.mkdir(MOSQUITTO_DIRECTORY, { recursive: true });

  // Check if config file not already exists
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(MOSQUITTO_CONFIG_FILE_PATH, constants.R_OK | constants.W_OK);
    logger.info('eclipse-mosquitto configuration file already exists.');

    // Ensure the listener line matches the resolved port (existing installs keep 1883)
    const configContent = (await fs.readFile(MOSQUITTO_CONFIG_FILE_PATH)).toString();
    if (!configContent.includes(listenerLine)) {
      const updatedContent = LISTENER_LINE_REGEXP.test(configContent)
        ? configContent.replace(LISTENER_LINE_REGEXP, listenerLine)
        : `${configContent}${os.EOL}${listenerLine}`;
      await fs.writeFile(MOSQUITTO_CONFIG_FILE_PATH, updatedContent);
    }
  } catch (e) {
    logger.info('Writting default eclipse-mosquitto configuration...');
    await fs.writeFile(MOSQUITTO_CONFIG_FILE_PATH, configContentLines.join(os.EOL));
  }

  // Create empty password file if not already exists
  const pwdFile = await fs.open(MOSQUITTO_PASSWORD_FILE_PATH, 'w');
  await pwdFile.close();
}

module.exports = {
  configureContainer,
};
