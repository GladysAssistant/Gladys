const axios = require('axios');
const retry = require('async-retry');
const sleep = require('sleep-promise');
const logger = require('../../../../utils/logger');

const { connect } = require('./overkiz.connect');

/**
 * @description Connect to OverKiz server.
 * @param {string} execId - Execution Id.
 * @returns {Promise<Object>} Return state of Execution.
 * @example
 * overkiz.getExecutionState('01234');
 */
async function getExecutionState(execId) {
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
}

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
  const response = await retry(
    async (bail) => {
      const tryResponse = await axios.post(`${this.overkizServer.endpoint}exec/apply`, payload, {
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

  logger.info(`Overkiz : Command sent - Exec Id: ${response.data.execId}`);

  const { execId } = response.data;

  let execResponse = await getExecutionState.bind(this)(execId);
  const { state1 } = execResponse.data;
  logger.debug(state1);
  await sleep(500); // Wait 2000 ms

  execResponse = await getExecutionState.bind(this)(execId);
  const { state2 } = execResponse.data;
  logger.debug(state2);
  await sleep(500); // Wait 2000 ms

  execResponse = await getExecutionState.bind(this)(execId);
  const { state3 } = execResponse.data;
  logger.debug(state3);
  await sleep(500); // Wait 2000 ms

  execResponse = await getExecutionState.bind(this)(execId);
  const { state4 } = execResponse.data;
  await sleep(500); // Wait 2000 ms
  
  logger.debug(state4);
}

module.exports = {
  sendCommand,
};
