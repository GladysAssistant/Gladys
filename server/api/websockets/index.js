const WebSocket = require('ws');
const { parseWebsocketMessage, formatWebsocketMessage } = require('../../utils/websocketUtils');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, ERROR_MESSAGES } = require('../../utils/constants');
const logger = require('../../utils/logger');

const WebsocketManager = function WebsocketManager(wss, gladys) {
  this.wss = wss;
  this.gladys = gladys;
  this.connections = {};
  this.gladys.event.on(EVENTS.WEBSOCKET.SEND, (event) => this.sendMessageUser(event));
  this.gladys.event.on(EVENTS.WEBSOCKET.SEND_ALL, (event) => this.sendMessageAllUsers(event));
};

/**
 * @description Send a websocket message to the user.
 * @param {object} event - The event to send.
 * @param {string} event.type - The type of event to send.
 * @param {object} event.payload - The payload of the event containing data.
 * @param {string} event.userId - The userId to send the message to.
 * @example
 * sendMessageUser(event);
 */
function sendMessageUser({ type, payload, userId }) {
  if (!this.connections[userId]) {
    return;
  }
  this.connections[userId].forEach((userConnection) => {
    if (userConnection && userConnection.client && userConnection.client.readyState === WebSocket.OPEN) {
      userConnection.client.send(formatWebsocketMessage(type, payload));
    }
  });
}

/**
 * @description Send a websocket message to all user.
 * @param {object} event - Event.
 * @param {string} event.type - Type of event.
 * @param {object} event.payload - Payload to send.
 * @example
 * sendMessageAllUsers(event);
 */
function sendMessageAllUsers({ type, payload }) {
  const usersIds = Object.keys(this.connections);
  usersIds.forEach((userId) => {
    this.connections[userId].forEach((userConnection) => {
      if (userConnection && userConnection.client && userConnection.client.readyState === WebSocket.OPEN) {
        userConnection.client.send(formatWebsocketMessage(type, payload));
      }
    });
  });
}

/**
 * @description When a user is connected.
 * @param {object} user - User Object.
 * @param {object} client - Websocket client.
 * @returns {null} Return when finished.
 * @example
 * userConnected(user, ws);
 */
function userConnected(user, client) {
  logger.debug(`User ${user.firstname} connected in websocket`);
  if (!this.connections[user.id]) {
    this.connections[user.id] = [];
  }
  const connectionIndex = this.connections[user.id].findIndex((elem) => elem.client === client);

  if (connectionIndex === -1) {
    this.connections[user.id].push({
      user,
      client,
    });
  }

  return null;
}

/**
 * @description When a user is disconnected.
 * @param {object} user - User Object.
 * @param {object} client - Websocket client.
 * @returns {null} Return when finished.
 * @example
 * userDisconnected(user, ws);
 */
function userDisconnected(user, client) {
  logger.debug(`User ${user.firstname} connected in websocket`);
  if (!this.connections[user.id]) {
    this.connections[user.id] = [];
  }
  const connectionIndex = this.connections[user.id].findIndex((elem) => elem.client === client);

  if (connectionIndex !== -1) {
    this.connections[user.id].splice(connectionIndex, 1);
  }

  return null;
}

/**
 * @description Init websocket server.
 * @returns {null} Returns when finished.
 * @example
 * init();
 */
function init() {
  this.wss.on('connection', (ws) => {
    let user;
    let authenticated = false;
    ws.on('close', () => {
      if (user) {
        this.userDisconnected(user, ws);
      }
    });
    ws.on('message', async (data) => {
      const parsedMessage = parseWebsocketMessage(data);
      switch (parsedMessage.type) {
        case WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST:
          try {
            // we validate the token
            let payload;
            try {
              payload = this.gladys.session.validateAccessToken(parsedMessage.payload.accessToken, 'dashboard:write');
            } catch (e) {
              logger.debug(`Cannot validate websocket token with dashboard:write (${e}), trying with alarm:write`);
              payload = this.gladys.session.validateAccessToken(parsedMessage.payload.accessToken, 'alarm:write');
            }
            user = await this.gladys.user.getById(payload.user_id);
            authenticated = true;
            this.userConnected(user, ws);
          } catch (e) {
            ws.close(4000, ERROR_MESSAGES.INVALID_ACCESS_TOKEN);
          }
          break;
        default:
          logger.debug(`Message type not handled`);
      }
    });
    setTimeout(() => {
      if (authenticated === false) {
        ws.terminate();
      }
    }, 5000);
  });
  return null;
}

WebsocketManager.prototype.init = init;
WebsocketManager.prototype.userConnected = userConnected;
WebsocketManager.prototype.userDisconnected = userDisconnected;
WebsocketManager.prototype.sendMessageUser = sendMessageUser;
WebsocketManager.prototype.sendMessageAllUsers = sendMessageAllUsers;

module.exports = WebsocketManager;
