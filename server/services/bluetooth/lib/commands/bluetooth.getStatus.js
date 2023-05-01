/**
 * @description Retrieve current Bluetooth status.
 * @returns {object} Return status.
 * @example
 * bluetooth.getStatus();
 */
function getStatus() {
  const { ready, scanning, peripheralLookup, bluetooth } = this;
  const status = {
    ready: bluetooth !== undefined && ready,
    scanning,
    peripheralLookup,
  };
  return status;
}

module.exports = {
  getStatus,
};
