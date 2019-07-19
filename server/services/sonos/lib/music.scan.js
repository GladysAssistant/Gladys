/**
 * @private
 * @description Scan network
 * @example
 * scan();
 */
function scan() {
  const { Sonos, DeviceDiscovery } = this.sonosApi;
  DeviceDiscovery({ timeout: 10000 }, async (device) => {
    this.devices[device.host] = new Sonos(device.host);
    this.devices[device.host].setSpotifyRegion(this.sonosApi.SpotifyRegion.EU);
  });
}

module.exports = {
  scan,
};
