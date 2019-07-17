const DISCOVERY_PORT = 4321;
const MULTICAST_ADDRESS = '224.0.0.50';
/**
 * @description Get Error
 * @example
 * listening();
 */
async function listening() {
  this.socket.addMembership('224.0.0.50');
  const payload = '{"cmd": "whois"}';
  this.socket.send(payload, 0, payload.length, DISCOVERY_PORT, MULTICAST_ADDRESS);
}

module.exports = {
  listening,
};
