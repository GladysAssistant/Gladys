/**
 * @description Retrieve current Bluetooth status.
 * @example
 * bluetooth.getStatus();
 */
function getStatus() {
  const { ready, scanning, peripheralLookup } = this;
  const status = {
    ready,
    scanning,
    peripheralLookup,
  };
  return status;
}

module.exports = {
  getStatus,
};
