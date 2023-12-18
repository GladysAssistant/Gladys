const { convertToGladysDevice } = require('../utils/convertToGladysDevice');

/**
 * @description This will scan the network for sonos devices.
 * @returns {Promise<Array>} Resolves with device array.
 * @example sonos.scan();
 */
async function scan() {
  await this.manager.InitializeWithDiscovery(10);
  this.devices = this.manager.Devices.map((d) =>
    convertToGladysDevice(this.serviceId, {
      name: d.name,
      host: d.host,
      port: d.port,
      uuid: d.uuid,
    }),
  );
  this.manager.Devices.forEach((device) => {
    device.AVTransportService.Events.removeAllListeners(this.sonosLib.ServiceEvents.ServiceEvent);
    device.Events.removeAllListeners(this.sonosLib.SonosEvents.Volume);
    device.Events.on(this.sonosLib.SonosEvents.Volume, (volume) => {
      this.onVolumeEvent(device.uuid, volume);
    });
    device.AVTransportService.Events.on(this.sonosLib.ServiceEvents.Data, (data) => {
      this.onAvTransportEvent(device.uuid, data);
    });
  });
  return this.devices;
}

module.exports = {
  scan,
};
