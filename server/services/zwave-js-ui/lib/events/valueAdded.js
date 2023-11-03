const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { GENRE, PROPERTIES, ENDPOINTS } = require('../constants');
const { unbindValue } = require('../utils/bindValue');
const { getDeviceFeatureExternalId } = require('../utils/externalId');

/**
 * ValueAddedArgs.
 * @description When a value is added.
 * @param {object} zwaveNode - ZWave Node.
 * @param {object} args - ZWaveNodeValueAddedArgs.
 * @example
 * valueAdded({id: 0}, { commandClass: 0, endpoint: 0, property: '', propertyKey: '' });
 */
function valueAdded(zwaveNode, args) {
  const { commandClass, endpoint, property, propertyKey, value, label } = args;
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
    valueAdded.bind(this)(zwaveNode, args);
    return;
  }
  if (property === PROPERTIES.CURRENT_COLOR) {
    args.property = PROPERTIES.TARGET_COLOR;
    args.propertyName = PROPERTIES.TARGET_COLOR;
    args.writeable = true;
    valueAdded.bind(this)(zwaveNode, args);
    return;
  }

  if (!node.classes[commandClass]) {
    node.classes[commandClass] = {};
  }
  if (!node.classes[commandClass][endpoint]) {
    node.classes[commandClass][endpoint] = {};
  }
  let fullProperty = property + (propertyKey ? `-${propertyKey}` : '');
  if (fullProperty === PROPERTIES.TARGET_COLOR) {
    fullProperty = `${fullProperty}-${ENDPOINTS.TARGET_COLOR}`;
  }
  logger.debug(
    `Value Added: nodeId = ${nodeId}, comClass = ${commandClass}[${endpoint}], property = ${fullProperty}, value = ${value}`,
  );

  if ((GENRE[commandClass] || 'user') !== 'user') {
    // TODO Do not add non-user metadata, latter converted as device parameters
    return;
  }

  node.classes[commandClass][endpoint][fullProperty] = Object.assign(args, {
    genre: GENRE[commandClass] || 'user',
    // For technical use: number as key > string
    nodeId,
    commandClass,
    endpoint,
    property: fullProperty,
    label,
  });

  // if (node.ready) {
  const deviceFeatureExternalId = getDeviceFeatureExternalId({
    nodeId,
    commandClass,
    endpoint: endpoint || 0,
    property: fullProperty,
  });
  const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);

  if (value !== undefined && value !== null) {
    const newValueUnbind = unbindValue(args, value);
    node.classes[commandClass][endpoint][fullProperty].value = newValueUnbind;

    if (deviceFeature) {
      this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeatureExternalId,
        state: newValueUnbind,
      });
    }
  } else if (deviceFeature) {
    this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: deviceFeatureExternalId,
    });
  }
}

module.exports = {
  valueAdded,
};
