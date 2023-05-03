const logger = require('../../../../utils/logger');

/**
 * @description Connect to OverKiz server.
 * @returns {Promise<Object>} Return state of Execution.
 * @example
 * overkiz.getExecutionStates();
 */
/* async function getExecutionStates() {
  const response = await retry(
    async (bail) => {
      const tryResponse = await axios.get(`${this.overkizServer.endpoint}exec/current`, {
        headers: {
          'Cache-Control': 'no-cache',
          Host: this.overkizServer.endpoint.substring(
            this.overkizServer.endpoint.indexOf('/') + 2,
            this.overkizServer.endpoint.indexOf('/', 8),
          ),
          Connection: 'Keep-Alive',
          Cookie: `JSESSIONID=${this.sessionCookie}`,
        },
      });
      return tryResponse;
    },
    {
      retries: 5,
      onRetry: async (err, num) => {
        if (err.response && err.response.status === 401) {
          await connect.bind(this)();
          logger.info(`Overkiz : Connecting Overkiz server...`);
        } else {
          throw err;
        }
      },
    },
  );

  return response;
} */

/**
 * @description Connect to OverKiz server.
 * @param {string} execId - Execution Id.
 * @returns {Promise<Object>} Return state of Execution.
 * @example
 * overkiz.getExecutionState('01234');
 */
/* async function getExecutionState(execId) {
  const response = await retry(
    async (bail) => {
      const tryResponse = await axios.get(`${this.overkizServer.endpoint}exec/current/${execId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Host: this.overkizServer.endpoint.substring(
            this.overkizServer.endpoint.indexOf('/') + 2,
            this.overkizServer.endpoint.indexOf('/', 8),
          ),
          Connection: 'Keep-Alive',
          Cookie: `JSESSIONID=${this.sessionCookie}`,
        },
      });
      return tryResponse;
    },
    {
      retries: 5,
      onRetry: async (err, num) => {
        if (err.response && err.response.status === 401) {
          await connect.bind(this)();
          logger.info(`Overkiz : Connecting Overkiz server...`);
        } else {
          throw err;
        }
      },
    },
  );

  return response;
} */

/**
 * @description Connect to OverKiz server.
 * @param {Object} command - Command to send.
 * @param {string} deviceURL - DeviceURL.
 * @param {Object} data - Command data to send.
 * @returns {Promise<Object>} Return Object of informations.
 * @example
 * overkiz.sendCommand();
 */
async function sendCommand(command, deviceURL, data) {
  logger.info(`Overkiz : Sending command...`);

  const payload = {
    label: `${command} to device ${deviceURL}`,
    actions: [
      {
        deviceURL,
        commands: [
          {
            name: command,
            parameters: [data],
          },
        ],
      },
    ],
  };

  const response = await this.overkizServerAPI.exec(payload);
  const status = await response.wait();
  logger.debug(`Command sent: ${response.execId} - ${status}`);
}

module.exports = {
  sendCommand,
};
