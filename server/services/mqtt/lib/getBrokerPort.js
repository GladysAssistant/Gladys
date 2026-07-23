const { CONFIGURATION, DEFAULT } = require('./constants');
const { getContainersByExactName } = require('../../../utils/dockerContainers');
const logger = require('../../../utils/logger');

/**
 * @description Scan for the first free host port at or after a starting port, skipping the
 * ports hard-coded by other Gladys services.
 * @param {Function} isAvailable - Async predicate telling whether a port is free.
 * @param {number} startPort - Port to start scanning from.
 * @returns {Promise<number>} Resolve with a free, non-reserved port.
 * @example
 * const port = await findAvailablePort(this.isBrokerPortAvailable.bind(this), 1884);
 */
async function findAvailablePort(isAvailable, startPort) {
  let candidate = startPort;
  for (let attempt = 0; attempt < DEFAULT.MAX_PORT_SEARCH_ATTEMPTS; attempt += 1) {
    if (!DEFAULT.RESERVED_PORTS.includes(candidate)) {
      // eslint-disable-next-line no-await-in-loop
      if (await isAvailable(candidate)) {
        return candidate;
      }
    }
    candidate += 1;
  }
  throw new Error(`MQTT: unable to find a free broker port after ${DEFAULT.MAX_PORT_SEARCH_ATTEMPTS} attempts`);
}

/**
 * @description Resolve once, then persist, the host port of the embedded mosquitto broker.
 * An already-persisted port is reused as-is, and an existing install keeps the standard port
 * 1883 (it is never moved). Only on a fresh install where 1883 is already taken by another
 * process is the broker relocated to the next free port (reserved Gladys ports excluded).
 * @returns {Promise<number>} Resolve with the broker host port to use.
 * @example
 * const port = await mqtt.getBrokerPort();
 */
async function getBrokerPort() {
  const persisted = await this.gladys.variable.getValue(CONFIGURATION.MQTT_BROKER_PORT, this.serviceId);
  if (persisted) {
    return Number(persisted);
  }

  const defaultPort = DEFAULT.MOSQUITTO_DEFAULT_PORT;
  let port = defaultPort;

  // An existing broker of ours already listens on the default port: never move it.
  const brokerContainerName = await this.getBrokerContainerName();
  const existing = await getContainersByExactName(this.gladys.system, brokerContainerName);

  if (existing.length === 0 && !(await this.isBrokerPortAvailable(defaultPort))) {
    // Fresh install and the default port is taken by another process: relocate.
    port = await findAvailablePort(this.isBrokerPortAvailable.bind(this), defaultPort + 1);
    logger.warn(`MQTT: default broker port ${defaultPort} is already in use, relocating the broker to port ${port}`);
  }

  await this.gladys.variable.setValue(CONFIGURATION.MQTT_BROKER_PORT, String(port), this.serviceId);
  return port;
}

module.exports = {
  getBrokerPort,
};
