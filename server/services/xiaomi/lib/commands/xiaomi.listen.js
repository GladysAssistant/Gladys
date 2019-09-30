const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

const SERVER_PORT = 9898;
/**
 * @description Listen.
 * @example
 * xiaomi.listen();
 */
function listen() {
  this.socket = this.dgram.createSocket({ type: 'udp4', reuseAddr: true });
  this.socket.on('listening', eventFunctionWrapper(this.listening.bind(this)));
  this.socket.on('message', eventFunctionWrapper(this.onMessage.bind(this)));
  //  this.socket.on('data.weather', this.addTemperatureSensor.bind(this));
  this.socket.bind(SERVER_PORT);
}

module.exports = {
  listen,
};
