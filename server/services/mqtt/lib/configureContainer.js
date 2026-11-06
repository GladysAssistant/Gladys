const fs = require('fs/promises');
const { constants } = require('fs');
const os = require('os');

const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

const MOSQUITTO_DIRECTORY = '/var/lib/gladysassistant/mosquitto';
const MOSQUITTO_CONFIG_FILE_PATH = `${MOSQUITTO_DIRECTORY}/mosquitto.conf`;
const MOSQUITTO_PASSWORD_FILE_PATH = `${MOSQUITTO_DIRECTORY}/mosquitto.passwd`;

const MOSQUITTO_CONFIG_PORT = 'listener 1883';
const MOSQUITTO_CONFIG_CONTENT = [
  'allow_anonymous false',
  'connection_messages false',
  `password_file ${DEFAULT.PASSWORD_FILE_PATH}`,
  MOSQUITTO_CONFIG_PORT,
];

/**
 * @description Configure MQTT container.
 * @param {boolean} [resetPasswordFile] - Empty the password file (fresh install: its user is written right after).
 * @example
 * mqtt.configureContainer();
 */
async function configureContainer(resetPasswordFile = false) {
  logger.info('MQTT broker Docker container is being configured...');

  // Create configuration path (if not exists)
  await fs.mkdir(MOSQUITTO_DIRECTORY, { recursive: true });

  // Check if config file not already exists
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(MOSQUITTO_CONFIG_FILE_PATH, constants.R_OK | constants.W_OK);
    logger.info('eclipse-mosquitto configuration file already exists.');

    // Check for breaking change
    const configContent = await fs.readFile(MOSQUITTO_CONFIG_FILE_PATH);
    if (!configContent.includes(MOSQUITTO_CONFIG_PORT)) {
      await fs.appendFile(MOSQUITTO_CONFIG_FILE_PATH, `${os.EOL}${MOSQUITTO_CONFIG_PORT}`);
    }
  } catch (e) {
    logger.info('Writting default eclipse-mosquitto configuration...');
    await fs.writeFile(MOSQUITTO_CONFIG_FILE_PATH, MOSQUITTO_CONFIG_CONTENT.join(os.EOL));
  }

  // A fresh install starts from an empty password file ('w' truncates): no retired user survives,
  // and the Gladys user is written right after. Otherwise (mosquitto upgrade) the file is only
  // created if missing ('a' never truncates), so the stored credentials keep working.
  const pwdFile = await fs.open(MOSQUITTO_PASSWORD_FILE_PATH, resetPasswordFile ? 'w' : 'a');
  await pwdFile.close();
}

module.exports = {
  configureContainer,
};
