const { PACKET } = require('./awox.legacy.constants');

/**
 * @description Compute packet checksum.
 * @param {Array} packet - Array of bytes.
 * @returns {number} Checksum.
 * @example
 * checksum([ 0x01, ... ]);
 */
function checksum(packet) {
  const subPacket = packet.slice(1);
  return subPacket.reduce((prev, cur) => prev + cur, PACKET.CHECKSUM_START);
}

module.exports = {
  checksum,
};
