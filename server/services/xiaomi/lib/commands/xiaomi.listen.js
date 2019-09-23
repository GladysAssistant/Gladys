const dgram = require('dgram');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

/**
 * @description Listen.
 * @example
 * xiaomi.listen();
 */
function listen() {
  this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  this.socket.on('listening', eventFunctionWrapper(this.listening.bind(this)));
  this.socket.on('message', eventFunctionWrapper(this.onMessage.bind(this)));
  //  this.socket.on('data.weather', this.addTemperatureSensor.bind(this));
  this.socket.bind(9898);
}

module.exports = {
  listen,
};
