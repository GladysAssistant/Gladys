const { MAX_LABEL_LENGTH } = require('./constants');
const { uniqueIdOf } = require('./config');
const { mergeState } = require('./adapters/helpers');
const { BATTERY_ADAPTER } = require('./adapters');

/**
 * @description Turn a Gladys selector into a matter.js endpoint id. The matter.js library keeps the endpoint
 * number of an id across restarts, which is what keeps the device paired in every ecosystem, so
 * the id must stay stable.
 * @param {string} selector - Gladys selector.
 * @returns {string} Endpoint id.
 * @example
 * endpointId('kitchen.light'); // 'kitchen-light'
 */
function endpointId(selector) {
  return selector.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

/**
 * @description Cut a string to the length Matter allows for basic information strings.
 * @param {string} value - String to cut.
 * @returns {string} The string, at most 32 characters long.
 * @example
 * truncate('A very long device name that does not fit');
 */
function truncate(value) {
  return String(value || '').slice(0, MAX_LABEL_LENGTH);
}

/**
 * @description Build the matter.js endpoints of a planned device. A device with one function is
 * one bridged endpoint; a device with several (a temperature and humidity sensor) is a bridged node
 * carrying one child endpoint per function, which every ecosystem shows as a single accessory.
 * @param {object} matter - The matter.js modules.
 * @param {object} device - Gladys device.
 * @param {object} plan - Plan of the device, from planDevice.
 * @param {object} ctx - Build context: read(feature) and command(feature, value).
 * @param {number} [number] - Endpoint number to reuse, when the device is rebuilt: ecosystems know
 * a device by its endpoint number, so keeping it keeps the room and the name it was given there.
 * @returns {object} { root, children, functions: [{ adapter, roles, endpoint }], battery }, the
 * battery listing the endpoints that carry it: { adapter, roles, endpoints }.
 * @example
 * const built = buildEndpoints(matter, device, plan, ctx);
 */
function buildEndpoints(matter, device, plan, ctx, number) {
  const { Endpoint } = matter.main;
  const { BridgedDeviceBasicInformationServer } = matter.behaviors;
  const rootId = endpointId(device.selector);
  const rootOptions = number === undefined ? { id: rootId } : { id: rootId, number };
  const composed = plan.functions.length > 1;

  const parts = plan.functions.map(({ adapter, roles }) => ({
    adapter,
    roles,
    behaviors: [],
    states: [],
    ...adapter.build(matter, roles, ctx),
  }));

  // The battery goes on the root of the device, unless some functions must carry a power source
  // of their own: it then goes on each of them, so none has to pretend to be mains powered. A
  // single function shares its endpoint with the root, so there both are the same.
  const powered = parts.filter(({ adapter }) => adapter.requiresPowerSource);
  const root = { behaviors: [BridgedDeviceBasicInformationServer], states: [] };
  const batteryHosts = composed && powered.length > 0 ? powered : [root];
  if (plan.battery) {
    batteryHosts.forEach((host) => {
      host.behaviors.push(plan.battery.adapter.behavior(matter));
      host.states.push(plan.battery.adapter.state(plan.battery.roles, ctx));
    });
  } else {
    powered.forEach((part) => {
      part.behaviors.push(BATTERY_ADAPTER.wiredBehavior(matter));
      part.states.push(BATTERY_ADAPTER.wiredState());
    });
  }

  root.states.push({
    bridgedDeviceBasicInformation: {
      nodeLabel: truncate(device.name),
      productName: truncate(device.model || 'Gladys'),
      vendorName: 'Gladys',
      // Ecosystems know a bridged device by this id: it must stay unique, and a Gladys device id
      // (a 36 characters UUID) does not fit the 32 characters Matter allows, so it is hashed.
      uniqueId: uniqueIdOf(device.id),
      reachable: true,
    },
  });

  let rootEndpoint;
  let functions;
  let children = [];
  let batteryEndpoints = [];

  if (!composed) {
    const [part] = parts;
    rootEndpoint = new Endpoint(part.type.with(...root.behaviors, ...part.behaviors), {
      ...rootOptions,
      ...mergeState(part.state, ...part.states, ...root.states),
    });
    functions = [{ adapter: part.adapter, roles: part.roles, endpoint: rootEndpoint }];
    batteryEndpoints = [rootEndpoint];
  } else {
    rootEndpoint = new Endpoint(matter.endpoints.BridgedNodeEndpoint.with(...root.behaviors), {
      ...rootOptions,
      ...mergeState(...root.states),
    });
    // A child is numbered among the functions of its own kind only: matter.js keeps the endpoint
    // number of an id, so a new kind of function, or a change in the order adapters are tried,
    // must not rename the children already paired in the ecosystems.
    const counts = {};
    functions = parts.map((part) => {
      counts[part.adapter.key] = (counts[part.adapter.key] || 0) + 1;
      const type = part.behaviors.length > 0 ? part.type.with(...part.behaviors) : part.type;
      const endpoint = new Endpoint(type, {
        id: `${rootId}-${part.adapter.key}-${counts[part.adapter.key]}`,
        ...mergeState(part.state, ...part.states),
      });
      if (batteryHosts.includes(part)) {
        batteryEndpoints.push(endpoint);
      }
      return { adapter: part.adapter, roles: part.roles, endpoint };
    });
    children = functions.map(({ endpoint }) => endpoint);
    if (batteryEndpoints.length === 0) {
      batteryEndpoints = [rootEndpoint];
    }
  }

  return {
    root: rootEndpoint,
    children,
    functions,
    battery: plan.battery ? { ...plan.battery, endpoints: batteryEndpoints } : null,
  };
}

module.exports = {
  endpointId,
  truncate,
  buildEndpoints,
};
