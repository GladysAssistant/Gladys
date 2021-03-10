const { PACKET } = require('./awox.legacy.constants');
const { checksum } = require('./awox.legacy.checksum');

/**
 * @description Build packet from command code and message.
 * @param {number} code - Type of command.
 * @param {Array} message - Payload of the command.
 * @returns {Buffer} Complete packet.
 * @example
 * buildPacket(10, [ 0x01 ]);
 */
function buildPacket(code, message) {
  const messageLength = message.length;
  const packet = [];
  // Constant begin
  PACKET.PACKET_START.forEach((b) => packet.push(b));
  // Command code
  packet.push(code);
  // Message length
  packet.push(messageLength);
  // Message
  message.forEach((b) => packet.push(b));
  // Random
  const random = Math.floor(Math.random() * Math.floor(255));
  packet.push(random);
  // Checkum
  const check = checksum(packet);
  packet.push(check);
  // Constant end
  packet.push(PACKET.PACKET_END);
  return Buffer.from(packet);
}

module.exports = {
  buildPacket,
};
