const { promisify } = require('util');
const logger = require('../../../../utils/logger');
const { STATE } = require('./consts');

const onboardingState = async (connection) => {
  return new Promise((resolve, reject) => {
    connection.on('connect', (err) => {
      if (err) {
        logger.debug(`LGTV : Connection event error`);
        reject(err);
      }

      logger.debug(`LGTV : Connected`);

      resolve(STATE.CONNECTED);
    });
    connection.on('prompt', (err) => {
      if (err) {
        logger.debug(`LGTV : Prompt event error`);
        reject(err);
      }

      logger.debug(`LGTV : This user needs to authenticate via a prompt`);
      resolve(STATE.PROMPT);
    });
    connection.on('error', (err) => {
      logger.debug(`LGTV : Error connecting to TV: ${err}`);
      resolve(STATE.ERROR);
    });

    setTimeout(() => resolve(STATE.TIMEOUT), 1000);
  });
};

const getModelName = async (connection) => {
  try {
    return (await promisify(connection.request).bind(connection)('ssap://system/getSystemInfo')).modelName;
  } catch (e) {
    return null;
  }
};

const getDeviceID = async (connection) => {
  try {
    return (await promisify(connection.request).bind(connection)(
      'ssap://com.webos.service.update/getCurrentSWInformation',
    )).device_id;
  } catch (e) {
    return null;
  }
};

const timeout = (ms) =>
  new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(STATE.TIMEOUT);
    }, ms);
  });

module.exports = {
  getDeviceID,
  getModelName,
  onboardingState,
  timeout,
};
