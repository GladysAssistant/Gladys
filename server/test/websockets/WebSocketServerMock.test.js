const { fake } = require('sinon');
const EventEmitter = require('events');
const WebSocket = require('ws');

const WebSocketServerMock = function WebSocketServerMock() {
  this.ws = new EventEmitter();
  this.ws.close = fake.returns(null);
  this.ws.send = fake.returns(null);
  this.ws.terminate = fake.returns(null);
  this.ws.readyState = WebSocket.OPEN;
};

WebSocketServerMock.prototype.on = function on(type, cb) {
  cb(this.ws);
};

module.exports = WebSocketServerMock;
