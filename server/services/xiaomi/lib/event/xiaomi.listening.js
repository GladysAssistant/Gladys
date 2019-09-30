const DISCOVERY_PORT = 4321;
const MULTICAST_ADDRESS = '224.0.0.50';

/**
 * @description On listening event.
 * @example
 * xiaomi.listening();
 */
function listening() {
  this.socket.addMembership(MULTICAST_ADDRESS);
  const payload = '{"cmd": "whois"}';
  this.socket.send(payload, 0, payload.length, DISCOVERY_PORT, MULTICAST_ADDRESS);
}

module.exports = {
  listening,
};
