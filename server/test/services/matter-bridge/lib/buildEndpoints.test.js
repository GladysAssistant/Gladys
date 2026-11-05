const { expect } = require('chai');

const { buildEndpoints, endpointId, truncate } = require('../../../../services/matter-bridge/lib/buildEndpoints');
const { uniqueIdOf } = require('../../../../services/matter-bridge/lib/config');
const { planDevice } = require('../../../../services/matter-bridge/lib/planDevice');
const { createMatter, feature, createContext } = require('../fakes');

const behaviorNames = (type) => type.behaviors.map((b) => b.behaviorName);

describe('Matter bridge buildEndpoints', () => {
  const matter = createMatter();

  it('should build stable endpoint ids and short labels', () => {
    expect(endpointId('Kitchen.Light_1')).to.equal('kitchen-light_1');
    expect(truncate('x'.repeat(40))).to.have.lengthOf(32);
    expect(truncate(undefined)).to.equal('');
  });

  it('should build a single function device as one endpoint carrying its battery', () => {
    const device = {
      id: 'id-1',
      name: 'Thermometer',
      model: 'TH01',
      selector: 'thermometer',
      features: [feature('t', 'temperature-sensor', 'decimal'), feature('b', 'battery', 'integer')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({ t: 20, b: 50 }));
    expect(built.children).to.deep.equal([]);
    expect(built.root.id).to.equal('thermometer');
    expect(built.root.type.name).to.equal('TemperatureSensorDevice');
    expect(behaviorNames(built.root.type)).to.deep.equal(['BridgedDeviceBasicInformationServer', 'PowerSourceServer']);
    expect(built.root.state.temperatureMeasurement.measuredValue).to.equal(2000);
    expect(built.root.state.powerSource.batPercentRemaining).to.equal(100);
    expect(built.root.state.bridgedDeviceBasicInformation).to.deep.equal({
      nodeLabel: 'Thermometer',
      productName: 'TH01',
      vendorName: 'Gladys',
      uniqueId: uniqueIdOf('id-1'),
      reachable: true,
    });
    expect(built.functions[0].endpoint).to.equal(built.root);
    expect(built.battery.endpoint).to.equal(built.root);
  });

  it('should give two devices whose ids only differ at the end different unique ids', () => {
    const uniqueIdOfDevice = (id) => {
      const device = { id, name: 'Plug', selector: `plug-${id}`, features: [feature(id, 'switch', 'binary')] };
      return buildEndpoints(matter, device, planDevice(device), createContext({})).root.state
        .bridgedDeviceBasicInformation.uniqueId;
    };
    const first = uniqueIdOfDevice('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b0001');
    const second = uniqueIdOfDevice('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b0002');
    expect(first).to.have.lengthOf(32);
    expect(second).to.have.lengthOf(32);
    expect(first).to.not.equal(second);
  });

  it('should reuse the endpoint number of a rebuilt device', () => {
    const device = { id: 'id', name: 'Plug', selector: 'plug', features: [feature('p', 'switch', 'binary')] };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}), 42);
    expect(built.root.number).to.equal(42);
    expect(built.root.state.bridgedDeviceBasicInformation.productName).to.equal('Gladys');
    expect(built.battery).to.equal(null);
  });

  it('should build a multi function device as a bridged node with children', () => {
    const device = {
      id: 'id-2',
      name: 'Multi',
      selector: 'multi',
      features: [
        feature('t', 'temperature-sensor', 'decimal'),
        feature('h', 'humidity-sensor', 'decimal'),
        feature('b', 'battery', 'integer'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(built.root.type.name).to.equal('BridgedNodeEndpoint');
    expect(behaviorNames(built.root.type)).to.deep.equal(['BridgedDeviceBasicInformationServer', 'PowerSourceServer']);
    expect(built.children.map((c) => c.id)).to.deep.equal(['multi-temperature-1', 'multi-humidity-2']);
    expect(built.children[0].type.behaviors).to.deep.equal([]);
    expect(built.battery.endpoint).to.equal(built.root);
  });

  it('should give a mains power source to a smoke alarm without battery', () => {
    const device = { id: 'id', name: 'Smoke', selector: 'smoke', features: [feature('s', 'smoke-sensor', 'binary')] };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(behaviorNames(built.root.type)).to.deep.equal([
      'SmokeCoAlarmServer',
      'BridgedDeviceBasicInformationServer',
      'PowerSourceServer',
    ]);
    expect(built.root.state.powerSource.description).to.equal('Mains');
  });

  it('should keep the battery of a single smoke alarm on its endpoint', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [feature('s', 'smoke-sensor', 'binary'), feature('b', 'battery', 'integer')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({ b: 80 }));
    expect(built.root.state.powerSource.description).to.equal('Battery');
  });

  it('should move the battery of a multi function device onto its smoke alarm', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [
        feature('s', 'smoke-sensor', 'binary'),
        feature('t', 'temperature-sensor', 'decimal'),
        feature('b', 'battery', 'integer'),
      ],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(behaviorNames(built.root.type)).to.deep.equal(['BridgedDeviceBasicInformationServer']);
    const [alarm, thermometer] = built.children;
    expect(alarm.state.powerSource.description).to.equal('Battery');
    expect(thermometer.state).to.not.have.property('powerSource');
    expect(built.battery.endpoint).to.equal(alarm);
  });

  it('should give mains power to the smoke alarms of a multi function device without battery', () => {
    const device = {
      id: 'id',
      name: 'Smoke',
      selector: 'smoke',
      features: [feature('s', 'smoke-sensor', 'binary'), feature('t', 'temperature-sensor', 'decimal')],
    };
    const built = buildEndpoints(matter, device, planDevice(device), createContext({}));
    expect(built.children[0].state.powerSource.description).to.equal('Mains');
    expect(built.battery).to.equal(null);
  });
});
