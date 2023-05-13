const { promisify } = require('util');
const { CONFIGURATION, DEFAULT } = require('./constants');
const { NotFoundError } = require('../../../utils/coreErrors');
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
  const oldUser = await variable.getValue(CONFIGURATION.MQTT_USERNAME_KEY, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, useEmbeddedBroker, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_URL_KEY, mqttUrl, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_USERNAME_KEY, mqttUsername, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_PASSWORD_KEY, mqttPassword, this.serviceId);

  if (useEmbeddedBroker) {
    const dockerContainers = await this.gladys.system.getContainers({
      all: true,
      filters: { name: [containerParams.name] },
    });

    if (dockerContainers.length === 0) {
      throw new NotFoundError(`${containerParams.name} container not found`);
    }

    const [container] = dockerContainers;
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

  return this.connect({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker });
}

module.exports = {
  saveConfiguration,
};
