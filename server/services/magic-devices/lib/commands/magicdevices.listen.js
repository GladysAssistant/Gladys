const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

const DISCOVERY_PORT = 48899;
// const keyByte = new Buffer(PASSWORD, "ascii");
/**
 * @description Listen.
 * @example
 * magicdevices.listen();
 */
function listen() {
  this.socket = this.dgram.createSocket({ type: 'udp4', reuseAddr: true });
  this.socket.bind(DISCOVERY_PORT);
  this.socket.setBroadcast(true);
  this.socket.on('listening', eventFunctionWrapper(this.listening.bind(this)));
  this.socket.on('message', eventFunctionWrapper(this.onMessage.bind(this)));  
}

module.exports = {
  listen,
};
