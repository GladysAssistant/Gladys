const { promisify } = require('util');
const LGTV = require('lgtv2');
const logger = require('../../../../utils/logger');
const { STATE } = require('./consts');
const { getModelName, getDeviceID, timeout } = require('./utils');

const TIMEOUT = 5000; // ms

const prompt = async function prompt(address = null) {
  let connection;
  try {
    logger.debug(`LGTV : Connecting to TV to show prompt...`);

    connection = LGTV({
      url: `ws://${address !== null ? address : 'lgwebostv'}:3000`,
    });

    const addListener = promisify(connection.on).bind(connection);

    const error = addListener('error').then((e) => {
      throw new Error(`LGTV scan error ${e.message}`);
    });

    await Promise.race([error, addListener('connect'), timeout(TIMEOUT)]);

    const modelName = await getModelName(connection);
    const deviceExternalID = await getDeviceID(connection);

    return {
      address,
      state: STATE.CONNECTED,
      modelName,
      deviceExternalID,
    };
  } catch (e) {
    if (e === STATE.TIMEOUT) {
      return {
        state: STATE.TIMEOUT,
      };
    }
    logger.error(e);
    return {
      state: STATE.ERROR,
    };
  } finally {
    if (connection) {
      connection.disconnect();
    }
  }
};

module.exports = prompt;
