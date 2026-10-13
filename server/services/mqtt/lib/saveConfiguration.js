const { promisify } = require('util');
const { CONFIGURATION, DEFAULT } = require('./constants');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { ConflictError, NotFoundError } = require('../../../utils/coreErrors');
const { findManagedContainer } = require('../../../utils/dockerContainers');
const { isBrokerConfiguredByGladys } = require('./isBrokerConfiguredByGladys');
const containerParams = require('../docker/eclipse-mosquitto-container.json');

const sleep = promisify(setTimeout);

const updateOrDestroyVariable = async (variable, key, value, serviceId) => {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)) {
    await variable.setValue(key, value, serviceId);
  } else {
    await variable.destroy(key, serviceId);
  }
};

/**
 * @description Save MQTT configuration.
 * @param {object} configuration - MQTT configuration.
 * @param {string} [configuration.mqttUrl] - MQTT URL.
 * @param {string} [configuration.mqttUsername] - MQTT username.
 * @param {string} [configuration.mqttPassword] - MQTT password.
 * @param {boolean} [configuration.useEmbeddedBroker] - MQTT embedded broker.
 * @returns {Promise} Resolve when configuration updated & connected.
 * @example
 * saveConfiguration(configuration);
 */
async function saveConfiguration({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker }) {
  const { variable } = this.gladys;

  let container = null;
  if (useEmbeddedBroker) {
    // Before persisting anything: a configuration that cannot be applied must not be stored.
    // Throws if the name is taken by a container that is not ours: it is never reconfigured
    container = await findManagedContainer(this.gladys.system, containerParams);

    if (!container) {
      throw new NotFoundError(`${containerParams.name} container not found`);
    }

    // A broker Gladys never configured (no label, no stored version) is a user one: never reconfigured
    const mosquittoVersion = await variable.getValue(CONFIGURATION.MQTT_MOSQUITTO_VERSION, this.serviceId);
    if (!isBrokerConfiguredByGladys(container, mosquittoVersion)) {
      throw new ConflictError(
        `Container "${containerParams.name}" already exists but was not configured by Gladys: rename or remove it`,
      );
    }
  }

  const oldUser = await variable.getValue(CONFIGURATION.MQTT_USERNAME_KEY, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, useEmbeddedBroker, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_URL_KEY, mqttUrl, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_USERNAME_KEY, mqttUsername, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_PASSWORD_KEY, mqttPassword, this.serviceId);

  if (useEmbeddedBroker) {
    if (container.state !== 'running') {
      await this.gladys.system.restartContainer(container.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
    }

    if (oldUser) {
      // Delete old user
      await this.gladys.system.exec(container.id, {
        Cmd: ['mosquitto_passwd', '-D', DEFAULT.PASSWORD_FILE_PATH, oldUser],
      });
    }

    if (mqttUsername) {
      // Generate password
      await this.gladys.system.exec(container.id, {
        Cmd: ['mosquitto_passwd', '-b', DEFAULT.PASSWORD_FILE_PATH, mqttUsername, mqttPassword],
      });
    }

    await this.gladys.system.restartContainer(container.id);
    // wait 5 seconds for the container to restart
    await sleep(5 * 1000);

    await updateOrDestroyVariable(
      variable,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      this.serviceId,
    );
  }

  await this.connect({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker });

  // Saving the configuration is an explicit request to have the service running:
  // clear a previous "manually stopped" status, otherwise the service would
  // still be skipped at next startup (see service.startAll).
  const serviceInDb = await this.gladys.service.getLocalServiceByName('mqtt');
  if (serviceInDb && serviceInDb.status === SERVICE_STATUS.STOPPED) {
    serviceInDb.set({ status: SERVICE_STATUS.RUNNING });
    await serviceInDb.save();
  }

  return null;
}

module.exports = {
  saveConfiguration,
};
