const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

const SERVER_PORT = 9898;
const DISCOVERY_PORT = 48899;
const PASSWORD = 'HF-A11ASSISTHREAD';
// const keyByte = new Buffer(PASSWORD, "ascii");
/**
 * @description Listen.
 * @example
 * magicdevices.listen();
 */
function listen() {
  this.socket = this.dgram.createSocket({ type: 'udp4', reuseAddr: true });
  this.socket.bind(DISCOVERY_PORT);

  this.socket.on('listening', eventFunctionWrapper(this.listening.bind(this)));
  this.socket.on('message', eventFunctionWrapper(this.onMessage.bind(this)));  
}

module.exports = {
  listen,
};
