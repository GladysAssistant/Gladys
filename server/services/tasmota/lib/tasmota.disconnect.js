/**
 * @description Disconnect service from dependencies.
 * @returns {any} NULL.
 * @example
 * disconnect();
 */
function disconnect() {
  Object.values(this.protocols).forEach((handler) => handler.disconnect());
  return null;
}

module.exports = {
  disconnect,
};
