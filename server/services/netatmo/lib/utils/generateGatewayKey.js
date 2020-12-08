const crypto = require('crypto');

const AQARA_IV = Buffer.from([
  0x17,
  0x99,
  0x6d,
  0x09,
  0x3d,
  0x28,
  0xdd,
  0xb3,
  0xba,
  0x69,
  0x5a,
  0x2e,
  0x6f,
  0x58,
  0x56,
  0x2e,
]);

/**
 * @description Generate a gateway key.
 * @param {string} token - Gateway token.
 * @param {string} password - Gateway password.
 * @returns {string} - Return the key.
 * @example
 * const key = generateGatewayKey('KLJKJKlkj', 'KJSKDLFJ');
 */
function generateGatewayKey(token, password) {
  const cipher = crypto.createCipheriv('aes-128-cbc', password, AQARA_IV);
  return cipher.update(token, 'ascii', 'hex');
  /* const cipher = crypto.createCipheriv('aes128', password, Buffer.from('17996d093d28ddb3ba695a2e6f58562e', 'hex'));
  let encodedString = cipher.update(token, 'utf8', 'hex');
  encodedString += cipher.final('hex');
  return encodedString.substring(0, 32); */
}

module.exports = {
  generateGatewayKey,
};
