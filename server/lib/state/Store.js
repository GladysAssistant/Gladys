const Store = function Store() {
  this.state = null;
};

/**
 * @description Merge a given state with the current state.
 * @param {object} update - Object to merge in the state.
 * @example
 * store.setState({
 *   alarm: 'disarmed',
 * });
 */
function setState(update) {
  if (typeof update === 'string') {
    this.state = update;
  } else if (this.state === null) {
    this.state = update;
  } else {
    Object.assign(this.state, update);
  }
}
/**
 * @description Return the value of a key in the store.
 * @returns {any} Return the full state in store.
 * @example
 * store.get();
 */
function get() {
  return this.state;
}
/**
 * @description Return the value of a key in the store.
 * @param {string} key - The key to lookup in the store.
 * @returns {any} Return the value of the key.
 * @example
 * store.getKey('alarm');
 */
function getKey(key) {
  return this.state[key];
}

Store.prototype.setState = setState;
Store.prototype.get = get;
Store.prototype.getKey = getKey;

module.exports = Store;
