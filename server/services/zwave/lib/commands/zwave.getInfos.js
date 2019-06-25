const logger = require('../../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Getting Z-Wave informations.
 * @returns {Object} Return Object of informations.
 * @example
 * zwave.getInfos();
 */
function getInfos() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('ZWAVE_DRIVER_NOT_RUNNING');
  }
  logger.debug(`Zwave : Getting informations...`);
  const info = {
    // returns controller's node id
    controller_node_id: this.zwave.getControllerNodeId(),
    // returns static update controller node id
    suc_node_id: this.zwave.getSUCNodeId(),
    // is the OZW-managed controller the primary controller for this zwave network?
    is_primary_controller: this.zwave.isPrimaryController(),
    // Query if the controller is a static update controller.
    is_static_update_controller: this.zwave.isStaticUpdateController(),
    // Query if the controller is using the bridge controller library.
    is_bridge_controller: this.zwave.isBridgeController(),
    // Get the version of the Z-Wave API library used by a controller.
    zwave_library_version: this.zwave.getLibraryVersion(),
    // Get a string containing the Z-Wave API library type used by a controller
    library_type_name: this.zwave.getLibraryTypeName(),
    // return send queue count
    send_queue_count: this.zwave.getSendQueueCount(),
  };

  return info;
}

module.exports = {
  getInfos,
};
