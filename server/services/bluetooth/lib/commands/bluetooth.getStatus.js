/**
 * @description Retrieve current Bluetooth status.
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
