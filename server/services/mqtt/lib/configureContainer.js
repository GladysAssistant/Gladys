const fs = require('fs/promises');
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

  // Read the existing configuration, if any. Only a missing file (ENOENT) falls back to the
  // default configuration; any other I/O error is surfaced instead of silently overwriting an
  // existing (possibly customized) configuration.
  let configContent = null;
  try {
    configContent = (await fs.readFile(MOSQUITTO_CONFIG_FILE_PATH)).toString();
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  if (configContent === null) {
    logger.info('Writting default eclipse-mosquitto configuration...');
    await fs.writeFile(MOSQUITTO_CONFIG_FILE_PATH, configContentLines.join(os.EOL));
  } else {
    logger.info('eclipse-mosquitto configuration file already exists.');

    // Match the actual (uncommented) listener directive, not a substring, so a commented or
    // differently-numbered line is correctly rewritten to the resolved port (existing installs
    // keep 1883). Append the directive only when none is present.
    const currentListener = configContent.match(LISTENER_LINE_REGEXP)?.[0];
    if (currentListener !== listenerLine) {
      const updatedContent = currentListener
        ? configContent.replace(LISTENER_LINE_REGEXP, listenerLine)
        : `${configContent}${os.EOL}${listenerLine}`;
      await fs.writeFile(MOSQUITTO_CONFIG_FILE_PATH, updatedContent);
    }
  }

  // Create empty password file if not already exists
  const pwdFile = await fs.open(MOSQUITTO_PASSWORD_FILE_PATH, 'w');
  await pwdFile.close();
}

module.exports = {
  configureContainer,
};
