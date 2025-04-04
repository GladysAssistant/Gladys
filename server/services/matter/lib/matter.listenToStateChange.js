const { OnOff, OccupancySensing, IlluminanceMeasurement } = require('@matter/main/clusters');
const { EVENTS, STATE } = require('../../../utils/constants');
/**
 * @description Listen to state changes of a device.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {object} device - The device object.
 * @example matter.listenToStateChange(nodeId, device);
 */
async function listenToStateChange(nodeId, device) {
  // Get the OnOff cluster from clusterClients map
  const onOff = device.clusterClients.get(OnOff.Complete.id);

  if (onOff) {
    // Subscribe to OnOff attribute changes
    onOff.addOnOffAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${device.number}:${OnOff.Complete.id}`,
        state: value ? STATE.ON : STATE.OFF,
      });
    });
  }

  const occupancy = device.clusterClients.get(OccupancySensing.Complete.id);
  if (occupancy) {
    // Subscribe to OccupancySensing attribute changes
    occupancy.addOccupancyAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${device.number}:${OccupancySensing.Complete.id}`,
        state: value.occupied ? STATE.ON : STATE.OFF,
      });
    });
  }

  const illuminance = device.clusterClients.get(IlluminanceMeasurement.Complete.id);
  if (illuminance) {
    // Subscribe to IlluminanceMeasurement attribute changes
    illuminance.addMeasuredValueAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${device.number}:${IlluminanceMeasurement.Complete.id}`,
        state: Math.round(value / 10),
      });
    });
  }
}

module.exports = {
  listenToStateChange,
};
