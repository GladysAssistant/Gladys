const logger = require('../../../../../../utils/logger');
const { BadParameters } = require('../../../../../../utils/coreErrors');

const { COMMANDS } = require('./utils/awox.mesh.ble.constants');
const { BLUETOOTH } = require('../awox.mesh.constants');
const { generatePairCommand } = require('../awox.mesh.commands');
const { generateRandomBytes, generateSessionKey } = require('../awox.mesh.utils');

/**
 * @description Authenticate to Mesh AwoX device.
 * @param {Object} peripheral - The connected Noble peripheral.
 * @param {Object} credentials - Mesh credentials.
 * @returns {Promise} Resolve when the message is send to device.
 * @example
 * authenticate({ external_id: 'bluetooth:0102030405'}, { user: 'meshName', password: 'meshPassword'});
 */
async function authenticate(peripheral, credentials) {
  logger.debug(`AwoX - BLEMesh: entering authentication mode...`);
  const randomSession = generateRandomBytes();

  const { user, password } = credentials;
  const pairCommand = generatePairCommand(user, password, randomSession);

  // Ask for authentication
  logger.debug(`AwoX - BLEMesh: authenticating...`);
  await this.bluetooth.writeDevice(peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.PAIR, pairCommand, true);

  // Open authentication mode
  logger.debug(`AwoX - BLEMesh: open authentication mode...`);
  await this.bluetooth.writeDevice(
    peripheral,
    BLUETOOTH.SERVICE,
    BLUETOOTH.CHARACTERISTICS.STATUS,
    COMMANDS.AUTHENTICATE,
    true,
  );

  // Get new session value
  logger.debug(`AwoX - BLEMesh: authentication getting status...`);
  const pairValue = await this.bluetooth.readDevice(peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.PAIR);
  logger.debug(`AwoX - BLEMesh: authentication status ${pairValue.toString('hex')}`);

  // Check session value
  switch (pairValue[0]) {
    case 0x0d:
      return generateSessionKey(user, password, randomSession, pairValue);
    case 0x0e:
      throw new BadParameters(`Awox - BLEMesh: bad authentication for ${peripheral.uuid}, check name and password`);
    default:
      throw new Error(`Awox - BLEMesh: unable to authenticate to ${peripheral.uuid}`);
  }
}

module.exports = {
  authenticate,
};
