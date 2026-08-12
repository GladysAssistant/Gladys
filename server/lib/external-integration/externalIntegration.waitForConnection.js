const WebSocket = require('ws');

const { MESSAGE_CONNECTION_WAIT_MS } = require('./constants');

/**
 * @description Wait for the WebSocket connection of an integration, bounded.
 * A started container is not a connected integration: at boot,
 * service.startAll starts the containers and the rest of the boot sequence
 * continues immediately, so a message forwarded in the following
 * milliseconds (the "Gladys just upgraded" notification) reached a
 * supervisor that had no socket yet. Waiting only makes sense while the
 * integration is expected to connect — inside the startup window: outside
 * of it a missing connection means stopped, degraded or broken, and the
 * caller must fail right away instead of hanging on a failure already known.
 * @param {object} service - The external integration service.
 * @param {number} [timeoutMs] - How long to wait at most.
 * @returns {Promise<boolean>} Resolve with true if the integration is connected.
 * @example
 * const connected = await gladys.externalIntegration.waitForConnection(service);
 */
async function waitForConnection(service, timeoutMs = MESSAGE_CONNECTION_WAIT_MS) {
  const ws = this.connections.get(service.id);
  if (ws && ws.readyState === WebSocket.OPEN) {
    return true;
  }
  if (!this.startupTimers.has(service.id)) {
    return false;
  }
  return new Promise((resolve) => {
    let waiters = this.connectionWaiters.get(service.id);
    if (!waiters) {
      waiters = new Set();
      this.connectionWaiters.set(service.id, waiters);
    }
    let timer;
    const done = (connected) => {
      clearTimeout(timer);
      waiters.delete(done);
      if (waiters.size === 0) {
        this.connectionWaiters.delete(service.id);
      }
      resolve(connected);
    };
    timer = setTimeout(() => done(false), timeoutMs);
    // don't keep the process alive just for this timer
    if (timer.unref) {
      timer.unref();
    }
    waiters.add(done);
  });
}

module.exports = {
  waitForConnection,
};
