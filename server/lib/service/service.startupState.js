const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @public
 * @description Return where the start of the integrations stands. At boot, Gladys starts its
 * integrations one after the other, and an integration that is not started yet cannot control its
 * devices: the front displays this state so the user knows why, instead of thinking it is broken.
 * @returns {object} The startup state: `in_progress`, `total` and `done` (number of integrations
 * to start and already handled, started or failed), `current` (the integration being started)
 * and `waiting` (the ones not started yet), each integration being `{ name, label }`.
 * @example
 * const { in_progress, done, total } = service.getStartupState();
 */
function getStartupState() {
  return this.startupState;
}

/**
 * @description Store the startup state of the integrations and send it to every connected client.
 * @param {object} startupState - The new startup state (see getStartupState).
 * @example
 * service.setStartupState({ in_progress: false, total: 0, done: 0, current: null, waiting: [] });
 */
function setStartupState(startupState) {
  this.startupState = startupState;
  if (this.eventManager) {
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.SERVICES_STARTUP,
      payload: startupState,
    });
  }
}

module.exports = {
  getStartupState,
  setStartupState,
};
