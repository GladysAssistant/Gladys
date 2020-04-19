/**
 * @description Disconnect Kodi Media Center and build connection.
 * @example
 * kodi.disconnect();
 */
function disconnect() {
    this.mapOfKodiConnection = null;
}

module.exports = {
  disconnect,
};
