const net = require('net');

/**
 * @description Check whether a TCP host port is free and bindable. In host network mode the
 * mosquitto broker binds the host port directly, so testing the bind from Gladys accurately
 * detects a port already taken by another process such as a user's own mosquitto.
 * @param {number} port - Host TCP port to test.
 * @returns {Promise<boolean>} Resolve with true when the port is free, false otherwise.
 * @example
 * const free = await mqtt.isBrokerPortAvailable(1883);
 */
function isBrokerPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

module.exports = {
  isBrokerPortAvailable,
};
