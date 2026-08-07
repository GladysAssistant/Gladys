/**
 * @description Whether the host can be rebooted/powered off. Reads the cached
 * mechanism detected by `detectHostPowerManagement()` (run at init), so this
 * stays synchronous and cheap — safe to call from the polled `getInfos()`.
 * @returns {boolean} True if a host-power mechanism is available.
 * @example
 * const available = system.isHostPowerManagementAvailable();
 */
function isHostPowerManagementAvailable() {
  return Boolean(this.hostPowerManagement);
}

module.exports = {
  isHostPowerManagementAvailable,
};
