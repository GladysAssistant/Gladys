/**
 * @description Force scanning for devices.
 * @param {string} protocol - Protocol to scan over.
 * @param {object} options - Options used to scan.
 * @example
 * scan(['http'], options);
 */
function scan(protocol, options) {
  this.getHandler(protocol).scan(options);
}

module.exports = {
  scan,
};
