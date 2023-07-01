const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { PROPERTIES, COMMAND_CLASSES } = require('../constants');
const { unbindValue } = require('../utils/bindValue');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * @description Notification about a node.
 * @param {object} zwaveNode - ZWave Node.
 * @param {object} args - ZWave ValueNotificationArgs.
 * @example
 * valueNotification({ id: 0, }, { commandClass: 0, endpoint: 0, property: '', propertyKey: '' }, 0);
 */
function valueNotification(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, value } = args;
  const nodeId = zwaveNode.id;
  const node = this.nodes[nodeId];
  if (!node) {
    logger.info(`Node ${nodeId} not available. By-pass message`);
    return;
  }

  // Current value is the final state of target value
  if (property === PROPERTIES.CURRENT_VALUE) {
    args.property = PROPERTIES.TARGET_VALUE;
    args.propertyName = PROPERTIES.TARGET_VALUE;
    args.writeable = true;
    valueNotification.bind(this)(zwaveNode, args);
    return;
  }

  const fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  args.fullProperty = fullProperty;
  const valueUnbind = unbindValue(args, value);
  logger.debug(
    `Value Notification: nodeId = ${nodeId} (Ready: ${node.ready}), comClass = ${commandClass}, endpoint = ${endpoint}, property = ${fullProperty}: ${valueUnbind}`,
  );

  if (node.ready) {
    node.classes[commandClass][endpoint || 0][fullProperty].value = valueUnbind;
    let deviceFeatureExternalId;
    if (commandClass === COMMAND_CLASSES.COMMAND_CLASS_SCENE_ACTIVATION) {
      deviceFeatureExternalId = getDeviceFeatureExternalId({
        nodeId,
        commandClass: COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE,
        endpoint: Math.floor(value / 10),
        property: `scene-00${Math.floor(value / 10)}`,
      });
    } else {
      deviceFeatureExternalId = getDeviceFeatureExternalId({
        nodeId,
        commandClass,
        endpoint: endpoint || 0,
        property: fullProperty,
      });
    }
    const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
    if (deviceFeature) {
      this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeatureExternalId,
        state: valueUnbind,
      });
    }
  }
}

module.exports = {
  valueNotification,
};
