const { ADAPTERS, BATTERY_ADAPTER } = require('./adapters');

/**
 * @description Work out what a Gladys device becomes on the Matter bridge: the Matter functions
 * its features make up, and its battery. Each adapter takes the features it uses among those left
 * by the previous ones, so a feature is never exposed twice.
 * @param {object} device - Gladys device, with its features.
 * @param {Array} [adapters] - Adapters to try, in order.
 * @returns {object|null} { functions: [{ adapter, roles }], battery }, or null when nothing in the
 * device can be exposed.
 * @example
 * const plan = planDevice(device);
 */
function planDevice(device, adapters = ADAPTERS) {
  let remaining = device.features || [];
  const functions = [];

  adapters.forEach((adapter) => {
    adapter.claim(remaining).forEach((roles) => {
      const claimed = Object.values(roles);
      remaining = remaining.filter((feature) => !claimed.includes(feature));
      functions.push({ adapter, roles });
    });
  });

  // A battery alone is not worth an accessory: it only rides along with a real function.
  if (functions.length === 0) {
    return null;
  }

  const [batteryRoles] = BATTERY_ADAPTER.claim(remaining);
  return {
    functions,
    battery: batteryRoles ? { adapter: BATTERY_ADAPTER, roles: batteryRoles } : null,
  };
}

/**
 * @description Describe the shape of a plan: what changes in it requires the Matter endpoints of
 * the device to be rebuilt, while a simple rename can be applied in place.
 * @param {object} device - Gladys device.
 * @param {object} plan - Plan of the device.
 * @returns {string} A signature, equal for two plans building the same endpoints.
 * @example
 * planSignature(device, plan);
 */
function planSignature(device, plan) {
  const describe = ({ adapter, roles }) => ({
    adapter: adapter.key,
    roles: Object.entries(roles).map(([role, f]) => [role, f.selector, f.category, f.type, f.min, f.max, f.unit]),
  });
  return JSON.stringify({
    selector: device.selector,
    // The model is the product name of the bridged device, set when its endpoints are built.
    model: device.model,
    functions: plan.functions.map(describe),
    battery: plan.battery ? describe(plan.battery) : null,
  });
}

module.exports = {
  planDevice,
  planSignature,
};
