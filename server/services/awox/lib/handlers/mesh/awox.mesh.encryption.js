const crypto = require('crypto');
const { nameAndPasswordEncrypt } = require('./awox.mesh.utils');

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
 * @description Encrypt command.
 * @param {Buffer} command - Command to encrypt.
 * @param {Buffer} sessionKey - Session key.
 * @returns {Buffer} Encrypted command.
 * @example
 * encryptCommand([ 0x01, 0x02 ], [ 0x03, 0x04 ]);
 */
function encryptCommand(command, sessionKey) {
  const encrypted = encrypt(sessionKey, command.slice(1));
  return Buffer.concat([command.slice(0, 1), encrypted]);
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

module.exports = {
  encrypt,
  encryptCommand,
  generateSessionKey,
};
