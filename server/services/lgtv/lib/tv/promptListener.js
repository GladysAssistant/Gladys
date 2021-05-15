const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { STATE } = require('./consts');

const eventFromState = (state, uuid, userId) => {
  switch (state) {
    case STATE.CONNECTED:
      return {
        type: WEBSOCKET_MESSAGE_TYPES.LGTV.CONNECTED,
        userId,
        payload: {
          uuid,
        },
      };
    case STATE.TIMEOUT:
      return {
        type: WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_TIMEOUT,
        userId,
        payload: {
          uuid,
        },
      };
    case STATE.ERROR:
      return {
        type: WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_ERROR,
        userId,
        payload: {
          uuid,
        },
      };
    default:
      throw new Error('State not implemented');
  }
};

const promptListener = function promptListener(event) {
  if (event.type === WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT) {
    (async () => {
      const { state } = await this.prompt();

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND, eventFromState(state, event.payload.uuid, event.userId));
    })();
  }
};

module.exports = promptListener;
