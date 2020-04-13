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
 * @param {Object} event - Event.
 * @example
 * sendMessageUser(event);
 */
function sendMessageUser({ type, payload, userId }) {
  if (!this.connections[userId]) {
    return;
  }
  this.connections[userId].forEach((userConnection) => {
    if (userConnection.subscriptions[type] > 0) {
      userConnection.client.send(formatWebsocketMessage(type, payload));
    } else {
      logger.trace(`No subscriber on ${type}`);
    }
  });
}

/**
 * @description Send a websocket message to all user.
 * @param {Object} event - Event.
 * @example
 * sendMessageAllUsers(event);
 */
function sendMessageAllUsers({ type, payload }) {
  const usersIds = Object.keys(this.connections);
  usersIds.forEach((userId) => {
    this.connections[userId].forEach((userConnection) => {
      if (userConnection.subscriptions[type] > 0) {
        userConnection.client.send(formatWebsocketMessage(type, payload));
      } else {
        logger.trace(`No subscriber on ${type}`);
      }
    });
  });
}

/**
 * @description When a user is connected.
 * @param {Object} user - User Object.
 * @param {Object} client - Websocket client.
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
      subscriptions: {},
    });
  }

  return null;
}

/**
 * @description When a user is disconnected.
 * @param {Object} user - User Object.
 * @param {Object} client - Websocket client.
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
 * @description Add subscriber to client.
 * @param {string} event - Event to subscribe to.
 * @param {Object} client - Websocket client.
 * @example
 * addSubscriber('device.new', ws);
 */
function addSubscriber(event, client) {
  logger.trace(`Websocket subscribed to ${event}`);

  Object.values(this.connections).forEach((connection) => {
    const connectionIndex = connection.findIndex((elem) => elem.client === client);

    if (connectionIndex !== -1) {
      const nbSubscribed = connection[connectionIndex].subscriptions[event] || 0;
      connection[connectionIndex].subscriptions[event] = nbSubscribed + 1;
    }
  });

  return null;
}

/**
 * @description Remove subscriber from client.
 * @param {string} event - Event to subscribe to.
 * @param {Object} client - Websocket client.
 * @example
 * removeSubscriber('device.new', ws);
 */
function removeSubscriber(event, client) {
  logger.trace(`Websocket unsubscribed from ${event}`);

  Object.values(this.connections).forEach((connection) => {
    const connectionIndex = connection.findIndex((elem) => elem.client === client);

    if (connectionIndex !== -1) {
      const nbSubscribed = connection[connectionIndex].subscriptions[event] || 0;
      connection[connectionIndex].subscriptions[event] = Math.max(nbSubscribed - 1, 0);
    }
  });

  return null;
}

/**
 * @description Init websocket server.
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
        case WEBSOCKET_MESSAGE_TYPES.SUBSCRIPTION.SUBSCRIBE:
          this.addSubscriber(parsedMessage.payload.event, ws);
          break;
        case WEBSOCKET_MESSAGE_TYPES.SUBSCRIPTION.UNSUBSCRIBE:
          this.removeSubscriber(parsedMessage.payload.event, ws);
          break;
        case WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST:
          try {
            // we validate the token
            const payload = this.gladys.session.validateAccessToken(
              parsedMessage.payload.accessToken,
              'dashboard:write',
            );
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
WebsocketManager.prototype.addSubscriber = addSubscriber;
WebsocketManager.prototype.removeSubscriber = removeSubscriber;

module.exports = WebsocketManager;
