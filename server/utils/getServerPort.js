// port used when SERVER_PORT is not set in the environment
const DEFAULT_SERVER_PORT = 1443;

/**
 * @description Return the port the Gladys web server listens on.
 * @returns {number} The server port.
 * @example
 * const port = getServerPort();
 */
function getServerPort() {
  return parseInt(process.env.SERVER_PORT, 10) || DEFAULT_SERVER_PORT;
}

module.exports = {
  getServerPort,
  DEFAULT_SERVER_PORT,
};
