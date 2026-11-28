const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const {
  VARIABLES,
  MATTER_NODE_STATUS,
  MATTER_NODE_STATUS_BY_STATE,
  MATTER_NODE_UNAVAILABLE_GRACE_MS,
  MATTER_NODE_STATE_CONNECTED,
} = require('../utils/constants');
const { isNodeAvailable } = require('../utils/getMatterAvailability');

/**
 * @description The connection state of a node as matter.js gives it (NodeStates).
 * @param {object} node - The Matter node.
 * @returns {number} The NodeStates value.
 * @example
 * getConnectionState(node); // 0
 */
function getConnectionState(node) {
  if (typeof node.connectionState === 'number') {
    return node.connectionState;
  }
  return node.isConnected ? MATTER_NODE_STATE_CONNECTED : 1;
}

/**
 * @description The status of a node and the bridged devices it reports unreachable.
 * @param {bigint|string} nodeId - The node ID.
 * @param {object} [node] - The Matter node, used when the node is not watched yet.
 * @returns {object} The status, availability, since, last contact and unreachable device paths of the node.
 * @example
 * matterHandler.getNodeStatus(1234n, node);
 */
function getNodeStatus(nodeId, node) {
  const key = nodeId.toString();
  const unreachableDevicePaths = Array.from(this.unreachableDevicePaths.get(key) || []);
  const lastContact = this.lastContacts.get(key) || null;
  const nodeStatus = this.nodeStatuses.get(key);
  if (nodeStatus) {
    return {
      status: nodeStatus.status,
      available: nodeStatus.available,
      since: nodeStatus.since,
      last_contact: lastContact,
      unreachable_device_paths: unreachableDevicePaths,
    };
  }
  const connectionState = node ? getConnectionState(node) : 1;
  const status = MATTER_NODE_STATUS_BY_STATE[connectionState] || MATTER_NODE_STATUS.DISCONNECTED;
  return {
    status,
    available: status === MATTER_NODE_STATUS.CONNECTED,
    since: null,
    last_contact: lastContact,
    unreachable_device_paths: unreachableDevicePaths,
  };
}

/**
 * @description Sends the status of a node to the fronts, so that the Matter pages show live
 * whether its devices are available.
 * @param {bigint|string} nodeId - The node ID.
 * @example
 * matterHandler.notifyNodeStatus(1234n);
 */
function notifyNodeStatus(nodeId) {
  const nodeStatus = this.getNodeStatus(nodeId);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MATTER.NODE_STATUS_CHANGED,
    payload: {
      node_id: nodeId.toString(),
      status: nodeStatus.status,
      available: nodeStatus.available,
      last_contact: nodeStatus.last_contact,
      unreachable_device_paths: nodeStatus.unreachable_device_paths,
    },
  });
}

/**
 * @description Records a new connection state of a node. A reconnecting node stays available for a
 * grace delay, then becomes unavailable if it did not come back.
 * @param {bigint|string} nodeId - The node ID.
 * @param {number} state - The NodeStates value given by matter.js.
 * @example
 * matterHandler.setNodeStatus(1234n, 2);
 */
function setNodeStatus(nodeId, state) {
  const key = nodeId.toString();
  const status = MATTER_NODE_STATUS_BY_STATE[state] || MATTER_NODE_STATUS.DISCONNECTED;
  const previous = this.nodeStatuses.get(key);
  if (previous && previous.status === status) {
    return;
  }
  const now = new Date();
  if (status === MATTER_NODE_STATUS.CONNECTED) {
    this.lastContacts.set(key, now);
  } else if (previous && previous.status === MATTER_NODE_STATUS.CONNECTED) {
    // the node is lost: its last contact must survive a restart of Gladys
    this.saveLastContacts();
  }
  const nodeStatus = { status, since: now };
  nodeStatus.available = isNodeAvailable(nodeStatus, now.getTime());
  this.nodeStatuses.set(key, nodeStatus);

  clearTimeout(this.nodeStatusTimers.get(key));
  this.nodeStatusTimers.delete(key);
  if (status === MATTER_NODE_STATUS.RECONNECTING) {
    this.nodeStatusTimers.set(
      key,
      setTimeout(() => {
        this.nodeStatusTimers.delete(key);
        // still the same reconnection: the node did not come back in time
        if (this.nodeStatuses.get(key) === nodeStatus) {
          nodeStatus.available = false;
          logger.info(`Matter: Node ${key} did not come back, its devices are unavailable`);
          this.notifyNodeStatus(key);
        }
      }, MATTER_NODE_UNAVAILABLE_GRACE_MS),
    );
  }
  logger.info(`Matter: Node ${key} is ${status}${nodeStatus.available ? '' : ' (unavailable)'}`);
  this.notifyNodeStatus(key);
}

/**
 * @description Records that a node was just heard of (data received, subscription alive).
 * @param {bigint|string} nodeId - The node ID.
 * @example
 * matterHandler.touchNode(1234n);
 */
function touchNode(nodeId) {
  const key = nodeId.toString();
  if (this.nodeStatuses.has(key)) {
    this.lastContacts.set(key, new Date());
  }
}

/**
 * @description Saves the last contact of each node, so that a node lost before Gladys restarts still
 * shows when it was last heard of. Written when a node is lost and when the controller stops, never
 * on each contact.
 * @returns {Promise} Resolves once saved; a failure is only logged.
 * @example
 * await matterHandler.saveLastContacts();
 */
async function saveLastContacts() {
  const lastContacts = {};
  this.lastContacts.forEach((date, key) => {
    lastContacts[key] = date.toISOString();
  });
  try {
    await this.gladys.variable.setValue(VARIABLES.MATTER_LAST_CONTACTS, JSON.stringify(lastContacts), this.serviceId);
  } catch (e) {
    logger.warn(`Matter: Unable to save the last contact of the nodes: ${e}`);
  }
}

/**
 * @description Reads the last contact of each node saved before Gladys restarted.
 * @example
 * await matterHandler.loadLastContacts();
 */
async function loadLastContacts() {
  try {
    const saved = JSON.parse(
      (await this.gladys.variable.getValue(VARIABLES.MATTER_LAST_CONTACTS, this.serviceId)) || '{}',
    );
    Object.keys(saved).forEach((key) => {
      const date = new Date(saved[key]);
      if (!this.lastContacts.has(key) && !Number.isNaN(date.getTime())) {
        this.lastContacts.set(key, date);
      }
    });
  } catch (e) {
    logger.warn(`Matter: Unable to read the last contact of the nodes: ${e}`);
  }
}

/**
 * @description Records whether a bridged device is reachable, as its bridge reports it.
 * @param {bigint|string} nodeId - The node ID of the bridge.
 * @param {string} devicePath - The path of the bridged device.
 * @param {boolean} reachable - Whether the bridge can reach the device.
 * @example
 * matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', false);
 */
function setDeviceReachability(nodeId, devicePath, reachable) {
  const key = nodeId.toString();
  const unreachableDevicePaths = this.unreachableDevicePaths.get(key) || new Set();
  // a missing value (attribute not read yet) counts as reachable: only a bridge saying "unreachable" counts
  const isUnreachable = reachable === false;
  if (unreachableDevicePaths.has(devicePath) === isUnreachable) {
    return;
  }
  if (isUnreachable) {
    unreachableDevicePaths.add(devicePath);
  } else {
    unreachableDevicePaths.delete(devicePath);
  }
  this.unreachableDevicePaths.set(key, unreachableDevicePaths);
  logger.info(`Matter: Bridged device ${devicePath} of node ${key} is ${isUnreachable ? 'unreachable' : 'reachable'}`);
  this.notifyNodeStatus(key);
}

/**
 * @description Forgets the status of a node (decommissioned, its last contact too) or of all nodes
 * (stopped: their last contact is kept for when the controller starts again).
 * @param {bigint|string} [nodeId] - The node ID, all nodes when missing.
 * @example
 * matterHandler.clearNodeStatuses();
 */
function clearNodeStatuses(nodeId) {
  if (nodeId === undefined) {
    this.nodeStatusTimers.forEach((timer) => clearTimeout(timer));
    this.nodeStatusTimers.clear();
    this.nodeStatuses.clear();
    this.unreachableDevicePaths.clear();
    this.bridgedDevices.clear();
    return;
  }
  const key = nodeId.toString();
  clearTimeout(this.nodeStatusTimers.get(key));
  this.nodeStatusTimers.delete(key);
  this.nodeStatuses.delete(key);
  this.lastContacts.delete(key);
  this.unreachableDevicePaths.delete(key);
  this.bridgedDevices.delete(key);
}

module.exports = {
  getConnectionState,
  getNodeStatus,
  notifyNodeStatus,
  setNodeStatus,
  touchNode,
  saveLastContacts,
  loadLastContacts,
  setDeviceReachability,
  clearNodeStatuses,
};
