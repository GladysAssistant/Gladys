const net = require('net');

/**
 * @description Find a free TCP port on the host by binding an ephemeral
 * port, excluding ports already assigned elsewhere.
 * @param {Set} [excludedPorts] - Ports that must not be returned.
 * @param {number} [attempts] - Remaining attempts before giving up.
 * @returns {Promise<number>} Resolve with a free port.
 * @example
 * const port = await getFreePort(new Set([42115]));
 */
async function getFreePort(excludedPorts = new Set(), attempts = 10) {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const assignedPort = server.address().port;
      server.close(() => resolve(assignedPort));
    });
  });
  if (!excludedPorts.has(port)) {
    return port;
  }
  if (attempts <= 1) {
    throw new Error('UNABLE_TO_FIND_FREE_PORT');
  }
  return getFreePort(excludedPorts, attempts - 1);
}

module.exports = {
  getFreePort,
};
