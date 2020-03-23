/* eslint-disable prefer-destructuring */
// eslint-disable-next-line jsdoc/check-alignment
/**
 * @description convert a rflink message to an array.
 * @param {string} data - Secure node.
 * @returns {Object} Return an array with an index for each value.
 * @example
 * rflink.RftoObj(data);
 */
function RfToObj(data) {
  const newDevice = {};
  const msg = String(data).split(';');

  if (parseInt(msg[0], 10) === 20 && parseInt(msg[1], 10) !== 0 && msg[2] !== 'OK' && msg[3] !== undefined) {
    newDevice.protocol = msg[2];
    newDevice.features = [];
    for (let i = 3; i < msg.length; i += 1) {
      if (msg[i].includes('=') === true) {
        const temp = msg[i].split('=');
        newDevice[`${temp[0].toLowerCase()}`] = temp[1];
      }
    }
  }

  return newDevice;
}

module.exports = RfToObj;
