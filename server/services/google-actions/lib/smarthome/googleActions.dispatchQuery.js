const get = require('get-value');

/**
 * @description Dispatch
 * @param {*} body - The body sent by google.
 * @returns {Promise} Return json response.
 * @example dispatchQuery(body)
 */
async function dispatchQuery(body) {
  const firstOrderIntent = get(body, 'inputs.0.intent');
  if (firstOrderIntent === 'action.devices.SYNC') {
    return this.onSync(body);
  }
  if (firstOrderIntent === 'action.devices.QUERY') {
    return this.onQuery(body);
  }
  if (firstOrderIntent === 'action.devices.EXECUTE') {
    return this.onExecute(body);
  }
  throw new Error(`Unknown type ${firstOrderIntent}`);
}

module.exports = {
  dispatchQuery,
};
