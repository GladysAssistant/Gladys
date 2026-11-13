const os = require('os');
const path = require('path');
const fse = require('fs-extra');
const { expect } = require('chai');

const { loadMatter } = require('../../../../services/matter-bridge/lib/loadMatter');
const { planDevice } = require('../../../../services/matter-bridge/lib/planDevice');
const { buildEndpoints } = require('../../../../services/matter-bridge/lib/buildEndpoints');
const { Bindings, isRemoteChange } = require('../../../../services/matter-bridge/lib/Bindings');
const { AIR_QUALITY, EXPRESSED_STATE } = require('../../../../services/matter-bridge/lib/constants');
const { feature, createContext } = require('../fakes');

// matter.js is a dependency of the service only: it is resolved from the service folder.
const SERVICE_PATH = path.join(__dirname, '../../../../services/matter-bridge');
// eslint-disable-next-line import/no-dynamic-require
const { MdnsService } = require(require.resolve('@matter/main/protocol', { paths: [SERVICE_PATH] }));

// Every other test of the bridge runs on fakes of matter.js. This one builds the endpoints of each
// adapter on the real matter.js, on a node that never goes online: it checks what the fakes
// cannot, the device types and behaviors, their features and mandatory attributes, and the
// observables the bindings listen to.

/**
 * @description Build a Gladys device.
 * @param {string} id - Device id, also its selector.
 * @param {Array} features - Features of the device.
 * @returns {object} The device.
 * @example
 * device('plug', [feature('plug-on', 'switch', 'binary')]);
 */
function device(id, features) {
  return { id, selector: id, name: id, model: 'Model', features };
}

const DEVICES = [
  device('on-off-light', [feature('on-off-light-binary', 'light', 'binary')]),
  device('dimmable-light', [
    feature('dimmable-light-binary', 'light', 'binary'),
    feature('dimmable-light-brightness', 'light', 'brightness'),
  ]),
  device('white-light', [
    feature('white-light-binary', 'light', 'binary'),
    feature('white-light-temperature', 'light', 'temperature', { min: 0, max: 100 }),
  ]),
  device('color-light', [
    feature('color-light-binary', 'light', 'binary'),
    feature('color-light-brightness', 'light', 'brightness'),
    feature('color-light-color', 'light', 'color', { min: 0, max: 16777215 }),
  ]),
  device('plug', [feature('plug-binary', 'switch', 'binary')]),
  device('shutter', [feature('shutter-position', 'shutter', 'position'), feature('shutter-state', 'shutter', 'state')]),
  device('curtain', [feature('curtain-state', 'curtain', 'state')]),
  device('door', [feature('door-contact', 'opening-sensor', 'binary')]),
  device('leak', [feature('leak-water', 'leak-sensor', 'binary')]),
  device('motion', [feature('motion-motion', 'motion-sensor', 'binary')]),
  device('presence', [feature('presence-presence', 'presence-sensor', 'binary')]),
  device('climate', [
    feature('climate-temperature', 'temperature-sensor', 'decimal', { unit: 'celsius', min: -40, max: 80 }),
    feature('climate-humidity', 'humidity-sensor', 'decimal'),
    feature('climate-pressure', 'pressure-sensor', 'decimal', { unit: 'hpa', min: 300, max: 1100 }),
    feature('climate-battery', 'battery', 'integer'),
  ]),
  device('lux', [feature('lux-lux', 'light-sensor', 'decimal', { min: 0, max: 100000 })]),
  device('alarm', [
    feature('alarm-smoke', 'smoke-sensor', 'binary'),
    feature('alarm-co', 'co-sensor', 'binary'),
    feature('alarm-battery', 'battery', 'integer'),
  ]),
  device('mains-alarm', [feature('mains-alarm-smoke', 'smoke-sensor', 'binary')]),
  device('air', [
    feature('air-pm25', 'pm25-sensor', 'decimal', { max: 1000 }),
    feature('air-pm10', 'pm10-sensor', 'decimal', { max: 1000 }),
    feature('air-co2', 'co2-sensor', 'integer', { max: 10000 }),
  ]),
];

// Last values of the features: the endpoints are built with a known state, as on a running Gladys.
const VALUES = {
  'on-off-light-binary': 1,
  'dimmable-light-binary': 1,
  'dimmable-light-brightness': 40,
  'white-light-binary': 0,
  'white-light-temperature': 30,
  'color-light-binary': 1,
  'color-light-brightness': 80,
  'color-light-color': 0xff8800,
  'plug-binary': 0,
  'shutter-position': 60,
  'door-contact': 1,
  'leak-water': 0,
  'motion-motion': 1,
  'presence-presence': 0,
  'climate-temperature': 21.5,
  'climate-humidity': 48,
  'climate-pressure': 1013,
  'climate-battery': 7,
  'lux-lux': 350,
  'alarm-smoke': 0,
  'alarm-co': 0,
  'alarm-battery': 90,
  'mains-alarm-smoke': 0,
  // A very poor air quality: an extended level of the AirQuality cluster.
  'air-pm25': 60,
  'air-co2': 1500,
};

describe('Matter bridge on the real matter.js', function realMatter() {
  this.timeout(60000);

  let matter;
  let mdnsService;
  let storagePath;
  let server;
  let aggregator;
  let logLevel;
  const built = new Map();

  before(async () => {
    matter = loadMatter();
    const { Environment, ServerNode, Endpoint, Logger, LogLevel } = matter.main;
    logLevel = Logger.level;
    Logger.level = LogLevel.ERROR;

    // The node never goes online, but matter.js loads its mDNS service as the node is built: a
    // stand-in keeps the test off the network.
    mdnsService = { limitedToNetInterface: undefined, close: () => {} };
    Environment.default.set(MdnsService, mdnsService);

    storagePath = await fse.mkdtemp(path.join(os.tmpdir(), 'gladys-matter-bridge-'));
    Environment.default.vars.set('storage.path', storagePath);
    Environment.default.vars.set('path.root', storagePath);

    server = await ServerNode.create({
      id: 'gladys-matter-bridge-test',
      commissioning: { passcode: 20202021, discriminator: 3840 },
      productDescription: { name: 'Gladys', deviceType: matter.endpoints.AggregatorEndpoint.deviceType },
      basicInformation: { vendorName: 'Gladys', vendorId: 0xfff1, productName: 'Gladys', productId: 0x8000 },
    });
    aggregator = new Endpoint(matter.endpoints.AggregatorEndpoint, { id: 'aggregator' });
    await server.add(aggregator);

    const ctx = { ...createContext(VALUES), command: () => null };
    // eslint-disable-next-line no-restricted-syntax
    for (const gladysDevice of DEVICES) {
      const endpoints = buildEndpoints(matter, gladysDevice, planDevice(gladysDevice), ctx);
      // eslint-disable-next-line no-await-in-loop
      await aggregator.add(endpoints.root);
      // eslint-disable-next-line no-restricted-syntax
      for (const child of endpoints.children) {
        // eslint-disable-next-line no-await-in-loop
        await endpoints.root.add(child);
      }
      built.set(gladysDevice.id, endpoints);
    }
  });

  after(async () => {
    if (server) {
      await server.close();
    }
    if (matter) {
      matter.main.Environment.default.delete(MdnsService, mdnsService);
      matter.main.Logger.level = logLevel;
    }
    if (storagePath) {
      await fse.remove(storagePath);
    }
  });

  it('should load the matter.js modules', () => {
    expect(matter.main.ServerNode).to.be.a('function');
    expect(matter.devices.OnOffLightDevice).to.be.an('object');
    expect(matter.endpoints.BridgedNodeEndpoint).to.be.an('object');
    expect(matter.behaviors.WindowCoveringServer).to.be.a('function');
  });

  it('should expose every adapter as a valid Matter endpoint', () => {
    expect(Array.from(built.keys())).to.deep.equal(DEVICES.map(({ id }) => id));
    built.forEach((endpoints) => {
      [endpoints.root, ...endpoints.children].forEach((endpoint) => {
        expect(endpoint.lifecycle.isReady).to.equal(true);
      });
    });
  });

  it('should give the bindings the observables the adapters listen to', () => {
    built.forEach(({ functions }) => {
      functions.forEach(({ adapter, roles, endpoint }) => {
        adapter.listeners
          .filter((listener) => roles[listener.role])
          .forEach(({ cluster, attribute }) => {
            const events = endpoint.events[cluster];
            expect(events, `${endpoint.id} ${cluster}`).to.not.equal(undefined);
            expect(events[`${attribute}$Changed`], `${endpoint.id} ${cluster}.${attribute}`).to.have.property('on');
          });
      });
    });
  });

  it('should report the colour transition time the colour lights require', () => {
    const [light] = built.get('color-light').children;
    expect(light.state.colorControl.remainingTime).to.equal(0);
  });

  it('should override the movements of the real window covering behavior', () => {
    const Base = matter.behaviors.WindowCoveringServer.with('Lift', 'PositionAwareLift');
    expect(Base.prototype.handleMovement).to.be.a('function');
    expect(Base.prototype.handleStopMovement).to.be.a('function');
    const [shutter] = built.get('shutter').children;
    expect(shutter.state.windowCovering.currentPositionLiftPercent100ths).to.equal(4000);
  });

  it('should set the mandatory attributes of the power sources', () => {
    const [sensorRoot] = [built.get('climate').root];
    expect(sensorRoot.state.powerSource).to.include({ batReplacementNeeded: false, batPercentRemaining: 14 });
    const [mainsAlarm] = built.get('mains-alarm').children;
    expect(mainsAlarm.state.powerSource).to.include({ wiredCurrentType: 0 });
  });

  it('should report an air quality level of the extended scale', async () => {
    const [air] = built.get('air').children;
    expect(air.state.airQuality.airQuality).to.equal(AIR_QUALITY.VERY_POOR);
    const bindings = new Bindings({ event: { emit: () => null } });
    bindings.add(
      DEVICES.find(({ id }) => id === 'air'),
      built.get('air'),
    );
    await bindings.push({ device_feature: 'air-pm25', last_value: 300 });
    expect(air.state.airQuality.airQuality).to.equal(AIR_QUALITY.EXTREMELY_POOR);
    bindings.clear();
  });

  it('should not mistake a state the bridge pushes for a Matter command', async () => {
    const [plug] = built.get('plug').children;
    const contexts = [];
    const observer = (value, oldValue, context) => contexts.push(context);
    plug.events.onOff.onOff$Changed.on(observer);
    await plug.set({ onOff: { onOff: true } });
    plug.events.onOff.onOff$Changed.off(observer);
    expect(contexts).to.have.lengthOf(1);
    expect(isRemoteChange(contexts[0])).to.equal(false);
  });

  it('should express the smoke alarm first when smoke and CO are pushed at once', async () => {
    const alarmDevice = DEVICES.find(({ id }) => id === 'alarm');
    const [alarm] = built.get('alarm').children;
    const bindings = new Bindings({ event: { emit: () => null } });
    bindings.add(alarmDevice, built.get('alarm'));
    await Promise.all([
      bindings.push({ device_feature: 'alarm-smoke', last_value: 1 }),
      bindings.push({ device_feature: 'alarm-co', last_value: 1 }),
    ]);
    expect(alarm.state.smokeCoAlarm.expressedState).to.equal(EXPRESSED_STATE.SMOKE_ALARM);
    bindings.clear();
  });
});
