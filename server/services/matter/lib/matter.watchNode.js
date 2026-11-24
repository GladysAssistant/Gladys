const logger = require('../../../utils/logger');
const { getConnectionState, getStoredLastContact } = require('./matter.nodeStatus');

// The events of a node which mean it was just heard of
const CONTACT_EVENTS = ['connectionAlive', 'attributeChanged', 'eventTriggered'];

/**
 * @description Subscribes an observer to an event of a node, when the node has this event.
 * @param {object} node - The Matter node.
 * @param {string} eventName - The name of the event (node.events.<eventName>).
 * @param {Function} observer - The observer.
 * @returns {Function|null} A function removing the observer, or null when the node has no such event.
 * @example
 * const off = observeNodeEvent(node, 'stateChanged', (state) => {});
 */
function observeNodeEvent(node, eventName, observer) {
  const observable = node.events && node.events[eventName];
  if (!observable || typeof observable.on !== 'function') {
    return null;
  }
  observable.on(observer);
  return () => observable.off(observer);
}

/**
 * @description Follows the connection of a node for as long as Gladys knows it: its status (connected,
 * reconnecting, offline) and its last contact. A node is watched once; when matter.js gives a new
 * object for the same node (controller restarted, node re-paired), the former one is released.
 * @param {bigint} nodeId - The node ID.
 * @param {object} node - The Matter node (PairedNode).
 * @example
 * matterHandler.watchNode(1234n, node);
 */
function watchNode(nodeId, node) {
  const key = nodeId.toString();
  const watched = this.watchedNodes.get(key);
  if (watched && watched.node === node) {
    return;
  }
  if (watched) {
    this.unwatchNode(key);
  }
  const unsubscribers = [
    observeNodeEvent(node, 'stateChanged', (state) => this.setNodeStatus(key, state)),
    ...CONTACT_EVENTS.map((eventName) => observeNodeEvent(node, eventName, () => this.touchNode(key))),
  ].filter(Boolean);
  this.watchedNodes.set(key, { node, unsubscribers });
  logger.debug(`Matter: Watching the connection of node ${key}`);
  this.setNodeStatus(key, getConnectionState(node), getStoredLastContact(node));
}

/**
 * @description Stops following a node (decommissioned), or all nodes (controller stopped, reset).
 * @param {bigint|string} [nodeId] - The node ID, all nodes when missing.
 * @example
 * matterHandler.unwatchNode(1234n);
 */
function unwatchNode(nodeId) {
  const keys = nodeId === undefined ? Array.from(this.watchedNodes.keys()) : [nodeId.toString()];
  keys.forEach((key) => {
    const watched = this.watchedNodes.get(key);
    if (watched) {
      watched.unsubscribers.forEach((unsubscribe) => unsubscribe());
      this.watchedNodes.delete(key);
    }
  });
}

module.exports = {
  watchNode,
  unwatchNode,
};
