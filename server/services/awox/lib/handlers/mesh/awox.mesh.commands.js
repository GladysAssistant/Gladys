const { BadParameters } = require('../../../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

const {
  periperalUuidToBuffer,
  checksum,
  encrypt,
  generateRandomBytes,
  nameAndPasswordEncrypt,
} = require('./awox.mesh.utils');

/**
 * @description Generates command to send to device.
 * @param {string} type - Feature type.
 * @param {number} value - Feature value.
 * @returns {Object} Value encoded object with key and data properties.
 * @example
 * generateCategoryCommand('binary', 0);
 */
function generateCategoryCommand(type, value = undefined) {
  switch (type) {
    // Reset
    case 'reset':
      return { key: 0xe3, data: [0x00] };
    // Switch on/off
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      return { key: 0xd0, data: [value] };
    // Color
    case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
      const colorData = [0x04];
      colorData.push(Math.floor(value / 65536) % 256);
      colorData.push(Math.floor(value / 256) % 256);
      colorData.push(value % 256);

      return { key: 0xe2, data: colorData };
    }
    // White temperature
    case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
      const realValue = Math.round((value * 127) / 100);
      return { key: 0xf0, data: [realValue] };
    }
    // White brightness
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
      const realValue = Math.round((value * 127) / 100);
      return { key: 0xf1, data: [realValue] };
    }
    // Color saturation
    case DEVICE_FEATURE_TYPES.LIGHT.SATURATION: {
      const realValue = Math.round((value * 127) / 100);
      return { key: 0xf2, data: [realValue] };
    }
    default:
      throw new BadParameters(`Awox Mesh: ${type} feature type not handled`);
  }
}

/**
 * @description Generates command to send to device.
 * @param {Object} feature - Feature.
 * @param {number} value - Feature value.
 * @returns {Object} Value encoded object with key and data properties.
 * @example
 * generateCommand({ category: 'light', type: 'binary' }, 0);
 */
function generateCommand(feature, value) {
  const { category, type } = feature;

  switch (category) {
    case DEVICE_FEATURE_CATEGORIES.LIGHT:
    case DEVICE_FEATURE_CATEGORIES.BUTTON:
      return generateCategoryCommand(type, value);
    default:
      throw new BadParameters(`Awox Mesh: ${category} feature category not handled`);
  }
}

/**
 * @description Encrypt payload to send to device.
 * @param {Buffer} key - Encryption key.
 * @param {Buffer} nonce - Unique key.
 * @param {Buffer} payload - Payload.
 * @returns {Buffer} Value encoded buffer.
 * @example
 * cryptPayload(Buffer.from([0x00]), Buffer.from([0x01]), Buffer.from([0xEE]));
 */
function cryptPayload(key, nonce, payload) {
  const base = Buffer.alloc(16, 0x00);
  base.fill(nonce, 1, nonce.length + 1);
  const result = [];

  const pLength = payload.length;
  for (let i = 0; i < pLength; i += 16) {
    const encBase = encrypt(key, base);
    payload.forEach((nameC, j) => {
      // eslint-disable-next-line no-bitwise
      result.push(nameC ^ encBase[j + i]);
    });
    base.fill(base[0] + 1, 0, 1);
  }

  return Buffer.from(result);
}

/**
 * @description Generates pair command.
 * @param {string} meshName - Mesh name.
 * @param {string} meshPassword - Mesh password.
 * @param {Buffer} sessionRandom - Session.
 * @returns {Buffer} Value encoded buffer.
 * @example
 * generatePairCommand('username', 'password', Buffer.from([0xEE]));
 */
function generatePairCommand(meshName, meshPassword, sessionRandom) {
  const namePassBuffer = nameAndPasswordEncrypt(meshName, meshPassword);
  const encrypted = encrypt(sessionRandom, namePassBuffer);
  return Buffer.concat([Buffer.from([0x0c]), sessionRandom, encrypted.slice(0, 8)]);
}

/**
 * @description Generates command packet.
 * @param {string} peripheralUuid - Peripheral MAC address.
 * @param {Buffer} sessionKey - Session key.
 * @param {Object} command - Command to send.
 * @returns {Buffer} Buffer packet.
 * @example
 * generateCommandPacket('AABBCCDDEE', Buffer.from([0xEE]), { key: 0xAB, data: [0x01]});
 */
const generateCommandPacket = (peripheralUuid, sessionKey, command) => {
  // Sequence number, just need to be different, idea from https://github.com/nkaminski/csrmesh
  const random = generateRandomBytes(3);
  const { code, message } = command;

  // Build nonce
  const address = periperalUuidToBuffer(peripheralUuid);
  const nonce = Buffer.concat([address.slice(0, 4), Buffer.from([0x01]), random]);

  // Build paylod
  const destId = 0x00;
  let payload = Buffer.alloc(15, 0x00);
  payload.fill(destId, 0, 1);
  payload.fill(destId, 1, 2);
  payload.fill(code, 2, 3);
  payload.fill(0x60, 3, 4);
  payload.fill(0x01, 4, 5);
  payload.fill(Buffer.from(message), 5, 5 + message.length);

  // Compute checksum
  const checksumValue = checksum(sessionKey, nonce, payload);

  // Encryt payload
  payload = cryptPayload(sessionKey, nonce, payload);

  // Command
  return Buffer.concat([random, checksumValue.slice(0, 2), payload]);
};

/**
 * @description Decrypt recieved packet.
 * @param {string} peripheralUuid - Peripheral MAC address.
 * @param {Buffer} sessionKey - Session key.
 * @param {Buffer} packet - Message from device.
 * @example
 * decryptPacket('AABBCCDDEE', Buffer.from([0xEE]), Buffer.from([0x01]));
 */
function decryptPacket(peripheralUuid, sessionKey, packet) {
  // Build nonce
  const address = periperalUuidToBuffer(peripheralUuid);
  const nonce = Buffer.concat([address.slice(0, 3), packet.slice(0, 5)]);

  // Decrypt Payload
  const payload = cryptPayload(sessionKey, nonce, packet.slice(7));

  // Compute checksum
  const check = checksum(sessionKey, nonce, payload);

  // Check bytes
  if (Buffer.from(check.slice(0, 1)).equals(packet.slice(5, 6))) {
    // Decrypted packet
    const decrypted = Buffer.concat([packet.slice(0, 7), payload]);
    return decrypted;
  }
  throw new Error(`AwoX Mesh: invalid checksum from received data`);
}

module.exports = {
  generateCategoryCommand,
  generateCommand,
  generateCommandPacket,
  generatePairCommand,
  cryptPayload,
  decryptPacket,
};
