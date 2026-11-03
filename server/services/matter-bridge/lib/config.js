const crypto = require('crypto');
const path = require('path');

const { VARIABLES, INVALID_PASSCODES, MAX_PASSCODE, MAX_DISCRIMINATOR } = require('./constants');

/**
 * @description Folder where matter.js keeps the bridge: its fabrics, its endpoint numbers. It is
 * next to the Gladys database, and apart from the folder of the Matter controller, which the
 * controller wipes when it is reset.
 * @param {object} gladys - Gladys instance.
 * @returns {string} Storage folder.
 * @example
 * getStoragePath(gladys);
 */
function getStoragePath(gladys) {
  return process.env.MATTER_BRIDGE_FOLDER_PATH || path.join(path.dirname(gladys.config.storage), 'matter-bridge');
}

/**
 * @description Tell if a passcode is one Matter accepts.
 * @param {number} passcode - Setup passcode.
 * @returns {boolean} True when it is in range and not a forbidden one.
 * @example
 * isValidPasscode(20202021); // true
 */
function isValidPasscode(passcode) {
  return (
    Number.isInteger(passcode) && passcode > 0 && passcode <= MAX_PASSCODE && !INVALID_PASSCODES.includes(passcode)
  );
}

/**
 * @description Draw a random setup passcode Matter accepts.
 * @param {Function} [randomInt] - Random integer generator, crypto.randomInt by default.
 * @returns {number} Setup passcode.
 * @example
 * generatePasscode();
 */
function generatePasscode(randomInt = crypto.randomInt) {
  let passcode;
  do {
    passcode = randomInt(1, MAX_PASSCODE + 1);
  } while (!isValidPasscode(passcode));
  return passcode;
}

/**
 * @description Read a stored integer variable, or draw and store a new value when there is none
 * or it is not valid.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Service id.
 * @param {string} name - Variable name.
 * @param {Function} isValid - Tells if a value is usable.
 * @param {Function} generate - Draws a new value.
 * @returns {Promise<number>} The value.
 * @example
 * await readOrCreate(gladys, serviceId, VARIABLES.PASSCODE, isValidPasscode, generatePasscode);
 */
async function readOrCreate(gladys, serviceId, name, isValid, generate) {
  const stored = parseInt(await gladys.variable.getValue(name, serviceId), 10);
  if (isValid(stored)) {
    return stored;
  }
  const value = generate();
  await gladys.variable.setValue(name, String(value), serviceId);
  return value;
}

/**
 * @description Get the pairing configuration of the bridge, creating it on the first start.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - Service id.
 * @returns {Promise<object>} Resolves with { passcode, discriminator, serialNumber }.
 * @example
 * const { passcode, discriminator, serialNumber } = await getPairingConfig(gladys, serviceId);
 */
async function getPairingConfig(gladys, serviceId) {
  const passcode = await readOrCreate(gladys, serviceId, VARIABLES.PASSCODE, isValidPasscode, generatePasscode);
  const discriminator = await readOrCreate(
    gladys,
    serviceId,
    VARIABLES.DISCRIMINATOR,
    (value) => Number.isInteger(value) && value >= 0 && value <= MAX_DISCRIMINATOR,
    () => crypto.randomInt(0, MAX_DISCRIMINATOR + 1),
  );
  let serialNumber = await gladys.variable.getValue(VARIABLES.SERIAL_NUMBER, serviceId);
  if (!serialNumber) {
    serialNumber = crypto.randomBytes(8).toString('hex');
    await gladys.variable.setValue(VARIABLES.SERIAL_NUMBER, serialNumber, serviceId);
  }
  return { passcode, discriminator, serialNumber };
}

/**
 * @description Turn the Gladys version into the Matter software version of the bridge, so
 * ecosystems show which Gladys runs it.
 * @param {string} [gladysVersion] - Gladys version, as 'v4.70.1'.
 * @returns {object} The softwareVersion and softwareVersionString attributes.
 * @example
 * softwareVersionOf('v4.70.1'); // { softwareVersion: 47001, softwareVersionString: '4.70.1' }
 */
function softwareVersionOf(gladysVersion) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(gladysVersion || '');
  if (!match) {
    return { softwareVersion: 1, softwareVersionString: '1' };
  }
  const [, major, minor, patch] = match.map(Number);
  return {
    softwareVersion: major * 10000 + minor * 100 + patch,
    softwareVersionString: `${major}.${minor}.${patch}`,
  };
}

/**
 * @description Derive the unique id of the bridge from its serial number. Matter requires both,
 * and requires them to differ.
 * @param {string} serialNumber - Serial number of the bridge.
 * @returns {string} Unique id.
 * @example
 * uniqueIdOf('a1b2c3');
 */
function uniqueIdOf(serialNumber) {
  return crypto
    .createHash('sha256')
    .update(`gladys-matter-bridge:${serialNumber}`)
    .digest('hex')
    .slice(0, 32);
}

module.exports = {
  softwareVersionOf,
  uniqueIdOf,
  getStoragePath,
  isValidPasscode,
  generatePasscode,
  getPairingConfig,
};
