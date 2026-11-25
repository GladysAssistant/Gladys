const logger = require('../../../utils/logger');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../../utils/constants');
const { isNumber } = require('./converters');
const { COMMAND_DEBOUNCE_MS } = require('./constants');

/**
 * @description Tell if a matter.js change comes from a Matter controller. Changes made by the
 * bridge itself, when it forwards a Gladys state, run in a local context without a fabric and
 * must not be sent back to Gladys.
 * @param {object} [context] - The matter.js action context of the change.
 * @returns {boolean} True when an ecosystem made the change.
 * @example
 * isRemoteChange(context);
 */
function isRemoteChange(context) {
  return Boolean(context) && context.fabric !== undefined;
}

/**
 * @description Links between Gladys features and the Matter endpoints exposing them, in both
 * directions: Gladys states are pushed to Matter, Matter commands become Gladys actions.
 * @param {object} gladys - Gladys instance.
 * @param {number} [debounceMs] - Delay to wait for the last of a series of Matter changes.
 * @example
 * const bindings = new Bindings(gladys);
 */
function Bindings(gladys, debounceMs = COMMAND_DEBOUNCE_MS) {
  this.gladys = gladys;
  this.debounceMs = debounceMs;
  // Feature selector -> [{ device, adapter, roles, role, endpoint }]: a battery is on every
  // endpoint of the device that needs a power source.
  this.byFeature = new Map();
  // Device id -> functions to detach its listeners and timers
  this.cleanups = new Map();
  // Feature selector -> pending debounced command
  this.timers = new Map();
  // Feature selector -> pending end of a movement no state came for (see the settle of adapters)
  this.settles = new Map();
  // Gladys states are pushed one at a time: a state derived from several features (the expressed
  // state of a smoke and CO alarm, the overall air quality) is computed from the endpoint state,
  // which must hold the previous push.
  this.pushes = Promise.resolve();
}

/**
 * @description Ask Gladys to set a feature of a device, as any other integration would.
 * @param {object} device - Gladys device.
 * @param {object} feature - Gladys feature to set.
 * @param {number} value - Value to set.
 * @example
 * bindings.command(device, feature, 1);
 */
Bindings.prototype.command = function command(device, feature, value) {
  if (!isNumber(value)) {
    return;
  }
  this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, {
    type: ACTIONS.DEVICE.SET_VALUE,
    status: ACTIONS_STATUS.PENDING,
    value,
    device: device.selector,
    device_feature: feature.selector,
  });
};

/**
 * @description Index the features of a built device and listen to the Matter changes of its
 * endpoints.
 * @param {object} device - Gladys device.
 * @param {object} built - Endpoints of the device, from buildEndpoints.
 * @example
 * bindings.add(device, built);
 */
Bindings.prototype.add = function add(device, built) {
  const cleanups = [];
  const { battery } = built;
  const batteries = battery
    ? battery.endpoints.map((endpoint) => ({ adapter: battery.adapter, roles: battery.roles, endpoint }))
    : [];
  const functions = [...built.functions, ...batteries];

  functions.forEach(({ adapter, roles, endpoint }) => {
    Object.entries(roles).forEach(([role, feature]) => {
      if (!this.byFeature.has(feature.selector)) {
        this.byFeature.set(feature.selector, []);
        cleanups.push(() => this.byFeature.delete(feature.selector));
      }
      this.byFeature.get(feature.selector).push({ device, adapter, roles, role, endpoint });
      if (adapter.settle && adapter.settle.role === role) {
        cleanups.push(() => this.cancelSettle(feature.selector));
      }
    });

    adapter.listeners
      .filter((listener) => roles[listener.role])
      .forEach((listener) => {
        const events = endpoint.events[listener.cluster];
        const observable = events && events[`${listener.attribute}$Changed`];
        if (!observable) {
          return;
        }
        const feature = roles[listener.role];
        const handler = (value, oldValue, context) => {
          if (isRemoteChange(context)) {
            this.schedule(device, feature, listener.debounce, () => listener.toGladys(endpoint.state, feature, roles));
          }
        };
        observable.on(handler);
        cleanups.push(() => observable.off(handler));
        cleanups.push(() => this.cancel(feature));
      });
  });

  this.cleanups.set(device.id, cleanups);
};

/**
 * @description Forward a Matter change to Gladys, at once or once a series of changes is over.
 * The value is computed when it is sent, from the endpoint state at that time, so a colour set
 * through hue and saturation is sent once and complete.
 * @param {object} device - Gladys device.
 * @param {object} feature - Gladys feature to set.
 * @param {boolean} debounce - Wait for the last change of a series.
 * @param {Function} compute - Computes the Gladys value.
 * @example
 * bindings.schedule(device, feature, true, () => 50);
 */
Bindings.prototype.schedule = function schedule(device, feature, debounce, compute) {
  if (!debounce) {
    this.command(device, feature, compute());
    return;
  }
  this.cancel(feature);
  this.timers.set(
    feature.selector,
    setTimeout(() => {
      this.timers.delete(feature.selector);
      this.command(device, feature, compute());
    }, this.debounceMs),
  );
};

/**
 * @description Drop a pending debounced command.
 * @param {object} feature - Gladys feature.
 * @example
 * bindings.cancel(feature);
 */
Bindings.prototype.cancel = function cancel(feature) {
  clearTimeout(this.timers.get(feature.selector));
  this.timers.delete(feature.selector);
};

/**
 * @description Wait for the state of a feature to settle: when no state came for it for the delay
 * its adapter sets, the adapter computes a last change from the endpoint state, such as the end of
 * a movement no position came for. Each state pushed meanwhile starts the delay again.
 * @param {string} selector - Feature selector.
 * @example
 * bindings.settleLater('shutter-position');
 */
Bindings.prototype.settleLater = function settleLater(selector) {
  const binding = (this.byFeature.get(selector) || []).find(
    ({ adapter, role }) => adapter.settle && adapter.settle.role === role,
  );
  if (!binding) {
    return;
  }
  const { adapter, endpoint } = binding;
  this.cancelSettle(selector);
  this.settles.set(
    selector,
    setTimeout(() => {
      this.settles.delete(selector);
      const run = () => this.settleNow(adapter, endpoint, selector);
      // eslint-disable-next-line promise/prefer-await-to-then
      this.pushes = this.pushes.then(run, run);
    }, adapter.settle.delayMs),
  );
};

/**
 * @description Apply the change an adapter computes once the state of a feature settled: only to
 * be called through settleLater.
 * @param {object} adapter - Adapter of the endpoint.
 * @param {object} endpoint - The matter.js endpoint.
 * @param {string} selector - Feature selector.
 * @returns {Promise} Resolves once the endpoint is updated.
 * @example
 * await bindings.settleNow(cover, endpoint, 'shutter-position');
 */
Bindings.prototype.settleNow = async function settleNow(adapter, endpoint, selector) {
  try {
    const patch = adapter.settle.toMatter(endpoint.state);
    if (patch) {
      await endpoint.set(patch);
    }
  } catch (e) {
    logger.warn(`Matter bridge: unable to settle the state of ${selector}: ${e.message}`);
  }
};

/**
 * @description Drop a pending settle.
 * @param {string} selector - Feature selector.
 * @example
 * bindings.cancelSettle('shutter-position');
 */
Bindings.prototype.cancelSettle = function cancelSettle(selector) {
  clearTimeout(this.settles.get(selector));
  this.settles.delete(selector);
};

/**
 * @description Forget a device: its features, listeners and pending commands.
 * @param {string} deviceId - Gladys device id.
 * @example
 * bindings.remove(device.id);
 */
Bindings.prototype.remove = function remove(deviceId) {
  (this.cleanups.get(deviceId) || []).forEach((cleanup) => cleanup());
  this.cleanups.delete(deviceId);
};

/**
 * @description Forget every device.
 * @example
 * bindings.clear();
 */
Bindings.prototype.clear = function clear() {
  Array.from(this.cleanups.keys()).forEach((deviceId) => this.remove(deviceId));
};

/**
 * @description Push a new Gladys state to the Matter endpoints exposing the feature, once the
 * states pushed before are applied.
 * @param {object} event - Gladys NEW_STATE event.
 * @returns {Promise} Resolves once the endpoints are updated.
 * @example
 * await bindings.push({ device_feature: 'light-binary', last_value: 1 });
 */
Bindings.prototype.push = function push(event) {
  // pushNow logs what fails rather than reject, and the chain goes on after a rejection anyway: one
  // failing push must never stop the next ones.
  const run = () => this.pushNow(event);
  // eslint-disable-next-line promise/prefer-await-to-then
  this.pushes = this.pushes.then(run, run);
  return this.pushes;
};

/**
 * @description Push a new Gladys state to the Matter endpoints exposing the feature, at once:
 * only to be called through push.
 * @param {object} event - Gladys NEW_STATE event.
 * @returns {Promise} Resolves once the endpoints are updated, or at once when the feature is not
 * exposed.
 * @example
 * await bindings.pushNow({ device_feature: 'light-binary', last_value: 1 });
 */
Bindings.prototype.pushNow = async function pushNow(event) {
  const bindings = this.byFeature.get(event.device_feature);
  if (!bindings || !isNumber(event.last_value)) {
    return;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const { adapter, roles, role, endpoint } of bindings) {
    // Reading endpoint.state can throw too, on an endpoint being reset or closed: the whole push of
    // an endpoint is guarded, so the next endpoints and the next pushes still run.
    try {
      const patch = adapter.toMatter(role, event.last_value, roles, endpoint.state);
      if (patch) {
        // eslint-disable-next-line no-await-in-loop
        await endpoint.set(patch);
      }
    } catch (e) {
      logger.warn(`Matter bridge: unable to forward the state of ${event.device_feature}: ${e.message}`);
    }
  }
  // A state awaited to settle came: the delay starts again.
  if (this.settles.has(event.device_feature)) {
    this.settleLater(event.device_feature);
  }
};

module.exports = {
  Bindings,
  isRemoteChange,
};
