const { MAX_LABEL_LENGTH } = require('./constants');
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
 * @returns {object} { root, children, functions: [{ adapter, roles, endpoint }], battery }.
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

  // The battery goes on the root of the device, unless a function must carry a power source of
  // its own: it then goes there, so that function does not have to pretend to be mains powered.
  // A single function shares its endpoint with the root, so there both are the same.
  const powered = parts.filter(({ adapter }) => adapter.requiresPowerSource);
  const root = { behaviors: [BridgedDeviceBasicInformationServer], states: [] };
  const batteryHost = composed && powered.length > 0 ? powered[0] : root;
  if (plan.battery) {
    batteryHost.behaviors.push(plan.battery.adapter.behavior(matter));
    batteryHost.states.push(plan.battery.adapter.state(plan.battery.roles, ctx));
  }
  powered.forEach((part) => {
    const hasBattery = Boolean(plan.battery) && (part === batteryHost || !composed);
    if (!hasBattery) {
      part.behaviors.push(BATTERY_ADAPTER.wiredBehavior(matter));
      part.states.push(BATTERY_ADAPTER.wiredState());
    }
  });

  root.states.push({
    bridgedDeviceBasicInformation: {
      nodeLabel: truncate(device.name),
      productName: truncate(device.model || 'Gladys'),
      vendorName: 'Gladys',
      uniqueId: truncate(device.id),
      reachable: true,
    },
  });

  let rootEndpoint;
  let functions;
  let children = [];
  let batteryEndpoint;

  if (!composed) {
    const [part] = parts;
    rootEndpoint = new Endpoint(part.type.with(...root.behaviors, ...part.behaviors), {
      ...rootOptions,
      ...mergeState(part.state, ...part.states, ...root.states),
    });
    functions = [{ adapter: part.adapter, roles: part.roles, endpoint: rootEndpoint }];
    batteryEndpoint = rootEndpoint;
  } else {
    rootEndpoint = new Endpoint(matter.endpoints.BridgedNodeEndpoint.with(...root.behaviors), {
      ...rootOptions,
      ...mergeState(...root.states),
    });
    functions = parts.map((part, index) => {
      const type = part.behaviors.length > 0 ? part.type.with(...part.behaviors) : part.type;
      const endpoint = new Endpoint(type, {
        id: `${rootId}-${part.adapter.key}-${index + 1}`,
        ...mergeState(part.state, ...part.states),
      });
      if (part === batteryHost) {
        batteryEndpoint = endpoint;
      }
      return { adapter: part.adapter, roles: part.roles, endpoint };
    });
    children = functions.map(({ endpoint }) => endpoint);
    batteryEndpoint = batteryEndpoint || rootEndpoint;
  }

  return {
    root: rootEndpoint,
    children,
    functions,
    battery: plan.battery ? { ...plan.battery, endpoint: batteryEndpoint } : null,
  };
}

module.exports = {
  endpointId,
  truncate,
  buildEndpoints,
};
