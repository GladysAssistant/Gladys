/**
 * @description Initialize service with dependencies and connect to devices.
 * @returns {any} NULL.
 * @example
 * connect();
 */
function connect() {
  Object.values(this.protocols).forEach((handler) => handler.connect());
  return null;
}

module.exports = {
  connect,
};
