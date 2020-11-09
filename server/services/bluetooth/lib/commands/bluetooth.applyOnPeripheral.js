const Promise = require('bluebird');

const { connect } = require('../utils/peripheral/bluetooth.connect');

/**
 * @description Apply a function on a bluetooth peripheral.
 * It will first scan for it, then connect to it, apply function, and disconnect peripheral.
 * @param {string} peripheralUuid - The peripheral UUID to control.
 * @param {Function} applyFunc - Promise function to apply on periperhal.
 * @param {boolean} keepConnected - Keep device connected.
 * @returns {Promise} Promise of all read values.
 * @example
 * await bluetooth.applyOnPeripheral('peripheral', (peripheral) => console.log(peripheral.uuid));
 */
async function applyOnPeripheral(peripheralUuid, applyFunc, keepConnected = false) {
  this.peripheralLookup = true;

  return this.scan(true, peripheralUuid)
    .then((peripheral) =>
      connect(peripheral).then((connectedPerpheral) =>
        new Promise((resolve) => {
          try {
            return resolve(applyFunc(connectedPerpheral));
          } catch (e) {
            throw e;
          }
        }).finally(() => {
          if (!keepConnected) {
            connectedPerpheral.disconnect();
          }
        }),
      ),
    )
    .finally(() => {
      this.peripheralLookup = false;
      this.broadcastStatus();
    });
}

module.exports = {
  applyOnPeripheral,
};
