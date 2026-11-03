// Fake matter.js modules, recording what the bridge builds instead of running a Matter node.

/**
 * @description Create an observable like the matter.js ones.
 * @returns {object} Observable with on, off and emit.
 * @example
 * const observable = createObservable();
 */
function createObservable() {
  const handlers = new Set();
  return {
    handlers,
    on: (handler) => handlers.add(handler),
    off: (handler) => handlers.delete(handler),
    emit: (...args) => handlers.forEach((handler) => handler(...args)),
  };
}

/**
 * @description Create a fake endpoint or device type, recording the behaviors it is extended with.
 * @param {string} name - Type name.
 * @param {Array} [behaviors] - Behaviors already added.
 * @returns {object} Fake type.
 * @example
 * const type = createType('OnOffLightDevice');
 */
function createType(name, behaviors = []) {
  return {
    name,
    behaviors,
    deviceType: `${name}-device-type`,
    with: (...more) => createType(name, [...behaviors, ...more]),
  };
}

/**
 * @description Create a fake behavior class, recording its features and enabled elements.
 * @param {string} name - Behavior name.
 * @returns {Function} Fake behavior class.
 * @example
 * const Server = createBehavior('OnOffServer');
 */
function createBehavior(name) {
  const make = (features, enabled) => {
    class FakeBehavior {
      handleStopMovement() {
        this.stopped = true;
        return 'super-stop';
      }
    }
    FakeBehavior.behaviorName = name;
    FakeBehavior.features = features;
    FakeBehavior.enabled = enabled;
    FakeBehavior.with = (...more) => make([...features, ...more], enabled);
    FakeBehavior.enable = (flags) => make(features, flags);
    return FakeBehavior;
  };
  return make([], null);
}

let nextNumber = 2;

/**
 * @description Fake matter.js Endpoint: keeps its state, exposes $Changed observables for each
 * attribute it was created with, and records its children.
 * @param {object} type - Fake endpoint type.
 * @param {object} options - Endpoint options: id, number and states.
 * @example
 * const endpoint = new FakeEndpoint(type, { id: 'light', onOff: { onOff: true } });
 */
function FakeEndpoint(type, options) {
  const { id, number, ...state } = options;
  this.type = type;
  this.options = options;
  this.id = id;
  this.number = number === undefined ? nextNumber : number;
  nextNumber += 1;
  this.state = JSON.parse(JSON.stringify(state));
  this.children = [];
  this.deleted = false;
  this.events = {};
  Object.entries(state).forEach(([cluster, attributes]) => {
    this.events[cluster] = {};
    Object.keys(attributes).forEach((attribute) => {
      this.events[cluster][`${attribute}$Changed`] = createObservable();
    });
  });
}

FakeEndpoint.prototype.set = async function set(patch) {
  Object.entries(patch).forEach(([cluster, attributes]) => {
    this.state[cluster] = { ...this.state[cluster], ...attributes };
  });
};

FakeEndpoint.prototype.add = async function add(child) {
  this.children.push(child);
};

FakeEndpoint.prototype.delete = async function deleteEndpoint() {
  this.deleted = true;
};

/**
 * @description Create a fake set of matter.js modules.
 * @returns {object} The fake modules, plus the fake server node and the recorded variables.
 * @example
 * const matter = createMatter();
 */
function createMatter() {
  const vars = new Map();
  const server = {
    added: [],
    started: false,
    closed: false,
    state: {
      commissioning: {
        commissioned: true,
        pairingCodes: { qrPairingCode: 'MT:QR', manualPairingCode: '12345678901' },
      },
      operationalCredentials: {
        fabrics: [{ fabricIndex: 1, label: 'Apple Home', vendorId: 4937, rootPublicKey: 'secret' }],
      },
    },
    add: async (endpoint) => server.added.push(endpoint),
    start: async () => {
      server.started = true;
    },
    close: async () => {
      server.closed = true;
    },
  };

  const deviceNames = [
    'OnOffLightDevice',
    'DimmableLightDevice',
    'ColorTemperatureLightDevice',
    'ExtendedColorLightDevice',
    'OnOffPlugInUnitDevice',
    'WindowCoveringDevice',
    'ContactSensorDevice',
    'OccupancySensorDevice',
    'TemperatureSensorDevice',
    'HumiditySensorDevice',
    'LightSensorDevice',
    'PressureSensorDevice',
    'WaterLeakDetectorDevice',
    'SmokeCoAlarmDevice',
    'AirQualitySensorDevice',
  ];
  const behaviorNames = [
    'BridgedDeviceBasicInformationServer',
    'ColorControlServer',
    'WindowCoveringServer',
    'OccupancySensingServer',
    'SmokeCoAlarmServer',
    'PowerSourceServer',
    'CarbonDioxideConcentrationMeasurementServer',
    'Pm25ConcentrationMeasurementServer',
    'Pm10ConcentrationMeasurementServer',
  ];

  const devices = {};
  deviceNames.forEach((name) => {
    devices[name] = createType(name);
  });
  const behaviors = {};
  behaviorNames.forEach((name) => {
    behaviors[name] = createBehavior(name);
  });

  return {
    vars,
    server,
    main: {
      Environment: { default: { vars: { set: (key, value) => vars.set(key, value) } } },
      ServerNode: { create: async (options) => Object.assign(server, { options }) },
      Endpoint: FakeEndpoint,
    },
    devices,
    endpoints: {
      AggregatorEndpoint: createType('AggregatorEndpoint'),
      BridgedNodeEndpoint: createType('BridgedNodeEndpoint'),
    },
    behaviors,
  };
}

/**
 * @description Create a Gladys feature.
 * @param {string} selector - Feature selector.
 * @param {string} category - Feature category.
 * @param {string} type - Feature type.
 * @param {object} [extra] - Other properties.
 * @returns {object} The feature.
 * @example
 * feature('light-binary', 'light', 'binary');
 */
function feature(selector, category, type, extra = {}) {
  return { selector, category, type, min: 0, max: 100, ...extra };
}

/**
 * @description Build context reading values from a map and recording commands.
 * @param {object} [values] - Last values by feature selector.
 * @returns {object} Context with read, command and the recorded commands.
 * @example
 * const ctx = createContext({ 'light-binary': 1 });
 */
function createContext(values = {}) {
  const commands = [];
  return {
    commands,
    read: (f) => (f.selector in values ? values[f.selector] : null),
    command: (f, value) => commands.push([f.selector, value]),
  };
}

module.exports = {
  FakeEndpoint,
  createMatter,
  createObservable,
  feature,
  createContext,
};
