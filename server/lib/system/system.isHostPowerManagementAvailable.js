const fs = require('fs');

// systemd system DBus socket, standard locations.
const DBUS_SYSTEM_SOCKETS = ['/run/dbus/system_bus_socket', '/var/run/dbus/system_bus_socket'];
// dbus-send client binary, standard locations.
const DBUS_SEND_BINARIES = ['/usr/bin/dbus-send', '/bin/dbus-send'];

/**
 * @description Best-effort check that the host can be rebooted/powered off
 * through systemd-logind (DBus): we need to run on a Linux host, have the
 * dbus-send client binary available and the system DBus socket reachable
 * (mounted into the container on a standard install).
 * @returns {boolean} True if reboot/shutdown of the host can be attempted.
 * @example
 * const available = system.isHostPowerManagementAvailable();
 */
function isHostPowerManagementAvailable() {
  if (process.platform !== 'linux') {
    return false;
  }
  const hasBinary = DBUS_SEND_BINARIES.some((binaryPath) => fs.existsSync(binaryPath));
  const hasSocket = DBUS_SYSTEM_SOCKETS.some((socketPath) => fs.existsSync(socketPath));
  return hasBinary && hasSocket;
}

module.exports = {
  isHostPowerManagementAvailable,
};
