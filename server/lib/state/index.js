const Store = require('./Store');

/**
 * @description Update the state in a given entity.
 * @param {string} entity - The type of entity we should save the state to.
 * @param {string} entitySelector - The selector of the entity.
 * @param {object} update - The object to merge into the state.
 * @example
 * stateManager.setState('house', 'main-house', {
 *   alarm: 'disarmed'
 * });
 */
function setState(entity, entitySelector, update) {
  if (!this.state[entity][entitySelector]) {
    this.state[entity][entitySelector] = new Store();
  }
  this.state[entity][entitySelector].setState(update);
}

/**
 * @description Return the value of a key in the store.
 * @param {string} entity - The type of entity we should get the value from.
 * @param {string} entitySelector - The selector to identify one entity.
 * @returns {any} Return the full state in store.
 * @example
 * stateManager.get('device', 'main-lamp');
 */
function get(entity, entitySelector) {
  if (!this.state[entity][entitySelector]) {
    return null;
  }
  return this.state[entity][entitySelector].get();
}

/**
 * @description Return the value of a key in the store.
 * @param {string} entity - The type of entity we should get the value from.
 * @param {string} entitySelector - The selector to identify one entity.
 * @param {string} key - The key to get in the store.
 * @returns {any} Return the value found in the store.
 * @example
 * stateManager.getKey('house', 'main-house', 'alarm');
 */
function getKey(entity, entitySelector, key) {
  if (!this.state[entity][entitySelector]) {
    return null;
  }
  return this.state[entity][entitySelector].getKey(key);
}

/**
 * @description Delete a state.
 * @param {string} entity - The type of entity we should get the value from.
 * @param {string} entitySelector - The selector to identify one entity.
 * @example
 * stateManager.delete('house', 'main-house');
 */
function deleteState(entity, entitySelector) {
  if (this.state[entity][entitySelector]) {
    delete this.state[entity][entitySelector];
  }
}

const StateManager = function StateManager(event) {
  this.event = event;
  this.state = {
    house: {},
    user: {},
    userById: {},
    device: {},
    deviceByExternalId: {},
    deviceById: {},
    deviceFeature: {},
    deviceFeatureByExternalId: {},
    service: {},
    serviceById: {},
    sun: {},
    system: {},
    variable: {},
  };
};

StateManager.prototype.setState = setState;
StateManager.prototype.deleteState = deleteState;
StateManager.prototype.get = get;
StateManager.prototype.getKey = getKey;

module.exports = StateManager;
