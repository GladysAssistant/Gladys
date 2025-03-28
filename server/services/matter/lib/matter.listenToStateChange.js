const { OnOff } = require('@matter/main/clusters');
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
      console.log(`Device state changed to: ${value ? 'ON' : 'OFF'}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${device.number}:${OnOff.Complete.id}`,
        state: value ? STATE.ON : STATE.OFF,
      });
    });
  }
}

module.exports = {
  listenToStateChange,
};
