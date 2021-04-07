const dns = require('dns');
const LGTV = require('lgtv2');
const { promisify } = require('util');
const logger = require('../../../../utils/logger');
const { STATE } = require('./consts');
const { onboardingState, getModelName, getDeviceID } = require('./utils');

const lookup = promisify(dns.lookup);

const scan = async function scan() {
  let connection;
  try {
    logger.debug('LGTV : Scanning...');
    logger.debug('LGTV : DNS lookup for lgwebostv (standard hostname for TVs)...');
    // return [
    //   {
    //     address: '192.168.30.51',
    //     state: STATE.PROMPT,
    //     modelName: 'my model',
    //     deviceExternalID: '12345',
    //   },
    // ];
    const { address } = await lookup('lgwebostv');

    if (!address) {
      logger.debug(`LGTV : Could not find TV on network via DNS`);
      return [];
    }
    logger.debug(`LGTV : Found TV at ${address}`);
    logger.debug(`LGTV : Connecting to TV...`);
    connection = LGTV({
      url: 'ws://lgwebostv:3000',
    });

    const state = await onboardingState(connection);

    if (state === STATE.TIMEOUT) {
      logger.debug(`LGTV : Found DNS record "lgwebostv" but got timeout trying to connect`);
      return [];
    }

    const modelName = await getModelName(connection);
    const deviceExternalID = await getDeviceID(connection);

    return [
      {
        address: 'lgwebostv',
        state,
        modelName,
        deviceExternalID,
      },
    ];
  } catch (e) {
    logger.info('LGTV scan didnt find anything - last state: ', e);
    return [];
  } finally {
    if (connection) {
      connection.disconnect();
    }
  }
};

module.exports = scan;
