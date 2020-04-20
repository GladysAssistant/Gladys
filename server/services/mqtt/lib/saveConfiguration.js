const { CONFIGURATION } = require('./constants');
const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const containerParams = require('../docker/eclipse-mosquitto-container.json');

const updateOrDestroyVariable = async (variable, key, value, serviceId) => {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)) {
    await variable.setValue(key, value, serviceId);
  } else {
    await variable.destroy(key, serviceId);
  }
};

/**
 * @description Save MQTT configuration.
 * @param {Object} configuration - MQTT configuration.
 * @param {string} [configuration.mqttUrl] - MQTT URL.
 * @param {string} [configuration.mqttUsername] - MQTT username.
 * @param {string} [configuration.mqttPassword] - MQTT password.
 * @param {boolean} [configuration.useEmbeddedBroker] - MQTT embedded broker.
 * @example
 * saveConfiguration(configuration);
 */
async function saveConfiguration({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker }) {
  const { variable } = this.gladys;
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, useEmbeddedBroker, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_URL_KEY, mqttUrl, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_USERNAME_KEY, mqttUsername, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.MQTT_PASSWORD_KEY, mqttPassword, this.serviceId);

  if (useEmbeddedBroker) {
    try {
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
      }

      // Delete password file
      await this.gladys.system.exec(container.id, {
        Cmd: ['mosquitto_passwd', '-D', '/mosquitto/config/mosquitto.passwd'],
      });

      // Generate password
      await this.gladys.system.exec(container.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', mqttUsername, mqttPassword],
      });
      await this.gladys.system.restartContainer(container.id);
    } catch (e) {
      logger.error('MQTT embedded broker failed:', e);
    }
  }

  return this.connect({ mqttUrl, mqttUsername, mqttPassword, useEmbeddedBroker });
}

module.exports = {
  saveConfiguration,
};
