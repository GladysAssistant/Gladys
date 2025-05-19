/* eslint-disable no-unused-vars */
const EventEmitter = require('events');
const WebSocket = require('ws');
const { getTopicUrl, buildQuery, buildPassword, decrypt } = require('./utils');
const { getTuyaEnvConfig } = require('../utils/tuya.constants');

class TuyaMessageSubscribeWebsocket {
  static data = 'TUTA_DATA';
  static error = 'TUYA_ERROR';
  static open = 'TUYA_OPEN';
  static close = 'TUYA_CLOSE';
  static reconnect = 'TUYA_RECONNECT';
  static ping = 'TUYA_PING';
  static pong = 'TUYA_PONG';

  constructor(config) {
    this.config = Object.assign(
      {
        ackTimeoutMillis: 3000,
        subscriptionType: 'Failover',
        retryTimeout: 1000,
        maxRetryTimes: 100,
        timeout: 30000,
      },
      config,
    );

    this.server = null;
    this.timer = null;
    this.retryTimes = 0;
    this.event = new EventEmitter();
  }

  start() {
    this.server = this._connect();
  }

  open(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.open, cb);
  }

  message(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.data, cb);
  }

  ping(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.ping, cb);
  }

  pong(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.pong, cb);
  }

  reconnect(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.reconnect, cb);
  }

  error(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.error, cb);
  }

  close(cb) {
    this.event.on(TuyaMessageSubscribeWebsocket.close, cb);
  }

  ackMessage(messageId) {
    if (this.server) {
      this.server.send(JSON.stringify({ messageId }));
    }
  }

  _reconnect() {
    if (this.config.maxRetryTimes && this.retryTimes < this.config.maxRetryTimes) {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        this.retryTimes++;
        this._connect(false);
      }, this.config.retryTimeout);
    }
  }

  _connect(isInit = true) {
    const { accessId, accessKey, url, env } = this.config;
    const topicUrl = getTopicUrl(
      url,
      accessId,
      getTuyaEnvConfig(env).value,
      `?${buildQuery({ subscriptionType: 'Failover', ackTimeoutMillis: 30000 })}`,
    );
    const password = buildPassword(accessId, accessKey);
    const ws = new WebSocket(topicUrl, {
      rejectUnauthorized: false,
      headers: {
        username: accessId,
        password,
      },
    });
    this.subOpen(ws, isInit);
    this.subMessage(ws);
    this.subPing(ws);
    this.subPong(ws);
    this.subError(ws);
    this.subClose(ws);

    return ws;
  }

  subOpen(server, isInit = true) {
    server.on('open', (e) => {
      if (server.readyState === WebSocket.OPEN) {
        this.retryTimes = 0;
      }
      this.keepAlive(server);
      this.event.emit(isInit ? TuyaMessageSubscribeWebsocket.open : TuyaMessageSubscribeWebsocket.reconnect, server);
    });
  }

  subPing(server) {
    server.on('ping', () => {
      this.event.emit(TuyaMessageSubscribeWebsocket.ping, server);
      this.keepAlive(server);
      server.pong(this.config.accessId);
    });
  }

  subPong(server) {
    server.on('pong', () => {
      this.keepAlive(server);
      this.event.emit(TuyaMessageSubscribeWebsocket.pong, server);
    });
  }

  subMessage(server) {
    server.on('message', (data) => {
      try {
        this.keepAlive(server);
        const start = Date.now();
        this.logger('INFO', `receive msg, jsonMessage=${data}`);
        const obj = this.handleMessage(data);
        this.logger('INFO', 'the real message data:', obj);
        this.event.emit(TuyaMessageSubscribeWebsocket.data, server, obj);
        const end = Date.now();
        this.logger('INFO', `business processing cost=${end - start}`);
      } catch (e) {
        this.logger('ERROR', e);
        this.event.emit(TuyaMessageSubscribeWebsocket.error, e);
      }
    });
  }

  subClose(server) {
    server.on('close', (...data) => {
      this._reconnect();
      this.clearKeepAlive();
      this.event.emit(TuyaMessageSubscribeWebsocket.close, ...data);
    });
  }

  subError(server) {
    server.on('error', (e) => {
      this.event.emit(TuyaMessageSubscribeWebsocket.error, server, e);
    });
  }

  keepAlive(server) {
    this.clearKeepAlive();
    this.timer = setTimeout(() => {
      server.ping(this.config.accessId);
    }, this.config.timeout);
  }

  clearKeepAlive() {
    clearTimeout(this.timer);
  }

  handleMessage(data) {
    const { payload, properties, ...others } = JSON.parse(data);
    const encryptyModel = properties.em;
    const pStr = Buffer.from(payload, 'base64').toString('utf-8');
    const pJson = JSON.parse(pStr);
    pJson.data = decrypt(pJson.data, this.config.accessKey, encryptyModel);
    return { payload: pJson, ...others };
  }

  logger(level, ...info) {
    const realInfo = `${Date.now()} `;
    if (this.config.logger) {
      this.config.logger(level, realInfo, ...info);
    }
  }
}

module.exports = TuyaMessageSubscribeWebsocket;
