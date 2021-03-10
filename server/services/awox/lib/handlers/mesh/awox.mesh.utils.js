const crypto = require('crypto');

const { NoValuesFoundError } = require('../../../../../utils/coreErrors');
const { DEVICE_PARAMS } = require('./awox.mesh.constants');

/**
 * @description Transforms peripheral UUID to reversed buffer.
 * @param {string} peripheralUuid - Perpheral UUID (MAC address).
 * @returns {Buffer} Buffered MAC address.
 * @example
 * periperalUuidToBuffer('AABBCCDDEE');
 */
function periperalUuidToBuffer(peripheralUuid) {
  const reversedAddress = peripheralUuid
    .match(/.{1,2}/g)
    .reverse()
    .join('');
  return Buffer.from(reversedAddress, 'hex');
}

/**
 * @description Generates a random valued buffer.
 * @param {number} length - Expected buffer length (default 8).
 * @returns {Buffer} A random generated buffer.
 * @example
 * generateRandomBytes(3);
 */
function generateRandomBytes(length = 8) {
  return crypto.randomBytes(length);
}

/**
 * @description Encrypts Mesh name and password.
 * @param {string} meshName - Mesh name.
 * @param {string} meshPassword - Mesh password.
 * @returns {Buffer} An encoded buffer with credentials.
 * @example
 * nameAndPasswordEncrypt('username', 'password');
 */
function nameAndPasswordEncrypt(meshName, meshPassword) {
  const meshNameBuffer = Buffer.from(meshName, 'utf-8');
  const meshPasswordBuffer = Buffer.from(meshPassword, 'utf-8');
  // Need to have a 16 length array
  const encryptedBuffer = Buffer.alloc(16, 0x00);

  meshNameBuffer.forEach((nameC, i) => {
    // eslint-disable-next-line no-bitwise
    encryptedBuffer.fill(nameC ^ meshPasswordBuffer[i], i, i + 1);
  });

  return encryptedBuffer;
}

/**
 * @description Encrypts a value.
 * @param {Buffer} key - Encryption key.
 * @param {Buffer} value - Value to encrypt.
 * @returns {Buffer} Value encoded buffer.
 * @example
 * encrypt(Buffer.from([0x00]), Buffer.from([0x01]));
 */
function encrypt(key, value) {
  const sessionRandomECB = Buffer.alloc(16, 0x00);
  sessionRandomECB.fill(key, 0, key.length);

  const valueBuffer = Buffer.alloc(16, 0x00);
  valueBuffer.fill(value, 0, value.length);

  const cipher = crypto.createCipheriv('aes-128-ecb', sessionRandomECB.reverse(), Buffer.from([]));
  cipher.setAutoPadding(false);
  const encrypted = cipher.update(valueBuffer.reverse());
  return encrypted.reverse();
}

/**
 * @description Generates a session key.
 * @param {string} meshName - Mesh name.
 * @param {string} meshPassword - Mesh password.
 * @param {Buffer} sessionRandom - Random session.
 * @param {Buffer} responseRandom - Random value.
 * @returns {Buffer} Value encoded buffer.
 * @example
 * generateSessionKey('username', 'password', Buffer.from([0x00]), Buffer.from([0x01]));
 */
function generateSessionKey(meshName, meshPassword, sessionRandom, responseRandom) {
  const random = Buffer.concat([sessionRandom, responseRandom.slice(1, 9)]);
  const namePassBuffer = nameAndPasswordEncrypt(meshName, meshPassword);
  return encrypt(namePassBuffer, random);
}

/**
 * @description Compute message checksum.
 * @param {Buffer} key - Encryption key.
 * @param {Buffer} nonce - Unique key.
 * @param {Buffer} payload - Payload.
 * @returns {Buffer} Value encoded buffer.
 * @example
 * checksum(Buffer.from([0x00]), Buffer.from([0x01]), Buffer.from([0xEE]));
 */
function checksum(key, nonce, payload) {
  const base = Buffer.alloc(16, 0x00);
  const nLength = nonce.length;
  const pLength = payload.length;

  base.fill(nonce, 0, nLength);
  base.fill(pLength, nLength, nLength + 1);

  let checksumValue = encrypt(key, base);

  for (let i = 0; i < pLength; i += 16) {
    const checkPayload = Buffer.alloc(16, 0x00);
    const pSliced = payload.slice(i, i + 16);
    checkPayload.fill(pSliced, 0, pSliced.length);
    const encodedChecksum = checksumValue.map((nameC, j) => {
      // eslint-disable-next-line no-bitwise
      return nameC ^ checkPayload[j];
    });
    checksumValue = encrypt(key, Buffer.from(encodedChecksum));
  }

  return checksumValue;
}

/**
 * @description Extracts credentials from Gladys device.
 * @param {Object} device - Gladys device.
 * @returns {Object} Credentials.
 * @example
 * extractCredentials({ DEVICE_PARAMS. []});
 */
function extractCredentials(device) {
  const userParam = device.params.find((p) => p.name === DEVICE_PARAMS.MESH_NAME);
  if (!userParam) {
    throw new NoValuesFoundError(`AwoX Mesh: ${DEVICE_PARAMS.MESH_NAME} is mandatory on device ${device.selector}`);
  }

  const passwordParam = device.params.find((p) => p.name === DEVICE_PARAMS.MESH_PASSWORD);
  if (!passwordParam) {
    throw new NoValuesFoundError(`AwoX Mesh: ${DEVICE_PARAMS.MESH_PASSWORD} is mandatory on device ${device.selector}`);
  }

  return {
    user: userParam.value,
    password: passwordParam.value,
  };
}

module.exports = {
  periperalUuidToBuffer,
  generateRandomBytes,
  nameAndPasswordEncrypt,
  encrypt,
  generateSessionKey,
  checksum,
  extractCredentials,
};
