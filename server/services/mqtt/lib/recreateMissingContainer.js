const { promisify } = require('util');
const logger = require('../../../utils/logger');
const { findContainerByName } = require('../../../utils/dockerContainers');
const { CONFIGURATION, DEFAULT } = require('./constants');
const containerDescriptor = require('../docker/eclipse-mosquitto-container.json');

const sleep = promisify(setTimeout);

/**
 * @description Recreate the embedded broker when Gladys configured it but its container is missing,
 * typically after restoring a Gladys Plus backup on a new machine: the database holds the broker
 * credentials, but neither the container nor its password file exist anymore. The container is
 * recreated with the stored username and password, so the devices configured with them reconnect
 * (the "Install the broker" button generates a new password instead).
 * @param {object} configuration - MQTT service configuration, as returned by `getConfiguration`.
 * @returns {Promise<object>} Resolve with the configuration, updated when the container was recreated.
 * @example
 * const configuration = await mqtt.recreateMissingContainer(await mqtt.getConfiguration());
 */
async function recreateMissingContainer(configuration) {
  const { useEmbeddedBroker, brokerContainerAvailable, mosquittoVersion, mqttUsername, mqttPassword } = configuration;

  // `useEmbeddedBroker` is also true when MQTT was never configured: the stored Mosquitto version,
  // written as soon as Gladys configures its broker, tells the embedded broker was actually set up
  if (brokerContainerAvailable || !useEmbeddedBroker || !mosquittoVersion) {
    return configuration;
  }

  if (!mqttUsername || !mqttPassword) {
    logger.warn('MQTT: the embedded broker container is missing but no credentials are stored, not recreating it');
    return configuration;
  }

  try {
    // Whatever container carries our name (a user one, a broker Gladys never configured), it is left untouched
    const existingContainer = await findContainerByName(this.gladys.system, containerDescriptor.name);
    if (existingContainer) {
      logger.warn(`MQTT: a container named "${containerDescriptor.name}" already exists, leaving it untouched`);
      return configuration;
    }

    logger.info('MQTT: the embedded broker container is missing, recreating it with the stored credentials...');
    const container = await this.installContainer(false);
    await this.gladys.system.restartContainer(container.id);
    // wait 5 seconds for the container to start
    await sleep(5 * 1000);

    // The password file was created empty: write the stored user back, no new password is generated
    await this.gladys.system.exec(container.id, {
      Cmd: ['mosquitto_passwd', '-b', DEFAULT.PASSWORD_FILE_PATH, mqttUsername, mqttPassword],
    });

    // Restart the broker so that it loads the password file
    await this.gladys.system.restartContainer(container.id);
    // wait 5 seconds for the container to restart
    await sleep(5 * 1000);

    await this.gladys.variable.setValue(
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      this.serviceId,
    );
    logger.info('MQTT: embedded broker container recreated with the stored credentials');

    return { ...configuration, brokerContainerAvailable: true, mosquittoVersion: DEFAULT.MOSQUITTO_VERSION };
  } catch (e) {
    // Not worse than a missing broker: the service still starts, the broker can be installed from the setup page
    logger.error('MQTT: failed to recreate the embedded broker container:', e);
    return configuration;
  }
}

module.exports = {
  recreateMissingContainer,
};
