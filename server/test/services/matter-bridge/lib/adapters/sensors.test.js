const { expect } = require('chai');

const sensors = require('../../../../../services/matter-bridge/lib/adapters/sensors');
const { createMatter, feature, createContext } = require('../../fakes');

const UNKNOWN = { measuredValue: null, minMeasuredValue: null, maxMeasuredValue: null };

const cases = [
  {
    adapter: sensors.temperatureSensor,
    feature: feature('t', 'temperature-sensor', 'decimal', { unit: 'celsius' }),
    deviceType: 'TemperatureSensorDevice',
    initial: { temperatureMeasurement: UNKNOWN },
    value: 21.5,
    state: { temperatureMeasurement: { measuredValue: 2150 } },
  },
  {
    adapter: sensors.humiditySensor,
    feature: feature('h', 'humidity-sensor', 'decimal'),
    deviceType: 'HumiditySensorDevice',
    initial: { relativeHumidityMeasurement: UNKNOWN },
    value: 45,
    state: { relativeHumidityMeasurement: { measuredValue: 4500 } },
  },
  {
    adapter: sensors.lightSensor,
    feature: feature('l', 'light-sensor', 'integer'),
    deviceType: 'LightSensorDevice',
    initial: { illuminanceMeasurement: UNKNOWN },
    value: 1,
    state: { illuminanceMeasurement: { measuredValue: 1 } },
  },
  {
    adapter: sensors.pressureSensor,
    feature: feature('p', 'pressure-sensor', 'decimal', { unit: 'hPa' }),
    deviceType: 'PressureSensorDevice',
    initial: { pressureMeasurement: UNKNOWN },
    value: 1013,
    state: { pressureMeasurement: { measuredValue: 1013 } },
  },
  {
    adapter: sensors.contactSensor,
    feature: feature('c', 'opening-sensor', 'binary'),
    deviceType: 'ContactSensorDevice',
    initial: { booleanState: { stateValue: true } },
    value: 0,
    state: { booleanState: { stateValue: false } },
  },
  {
    adapter: sensors.leakSensor,
    feature: feature('w', 'leak-sensor', 'binary'),
    deviceType: 'WaterLeakDetectorDevice',
    initial: { booleanState: { stateValue: false } },
    value: 1,
    state: { booleanState: { stateValue: true } },
  },
];

describe('Matter bridge sensor adapters', () => {
  const matter = createMatter();

  cases.forEach(({ adapter, feature: f, deviceType, initial, value, state }) => {
    describe(adapter.key, () => {
      it('should claim its features, one endpoint each', () => {
        const other = { ...f, selector: 'other' };
        expect(adapter.claim([f, other, feature('x', 'unknown', 'decimal')])).to.deep.equal([
          { value: f },
          { value: other },
        ]);
      });

      it('should build an endpoint with an unknown value', () => {
        const built = adapter.build(matter, { value: f }, createContext({}));
        expect(built.type.name).to.equal(deviceType);
        expect(built.state).to.deep.equal(initial);
      });

      it('should build an endpoint with a known value and forward new ones', () => {
        const built = adapter.build(matter, { value: f }, createContext({ [f.selector]: value }));
        const [cluster] = Object.keys(state);
        expect(built.state[cluster]).to.deep.equal({ ...initial[cluster], ...state[cluster] });
        expect(adapter.toMatter('value', value, { value: f })).to.deep.equal(state);
        expect(adapter.listeners).to.deep.equal([]);
      });
    });
  });

  it('should expose motion and presence sensors as occupancy', () => {
    const { occupancySensor } = sensors;
    const motion = feature('m', 'motion-sensor', 'binary');
    const presence = feature('p', 'presence-sensor', 'binary');
    expect(occupancySensor.claim([motion, presence])).to.deep.equal([{ value: motion }, { value: presence }]);
    const built = occupancySensor.build(matter, { value: motion }, createContext({ m: 1 }));
    expect(built.type.name).to.equal('OccupancySensorDevice');
    expect(built.type.behaviors[0].features).to.deep.equal(['PassiveInfrared']);
    expect(built.state.occupancySensing).to.deep.equal({
      occupancy: { occupied: true },
      occupancySensorType: 0,
      occupancySensorTypeBitmap: { pir: true },
    });
    expect(occupancySensor.toMatter('value', 0, { value: motion })).to.deep.equal({
      occupancySensing: { occupancy: { occupied: false } },
    });
  });

  it('should not expose the network presence of the Bluetooth and LAN scanners', () => {
    const { occupancySensor } = sensors;
    const bluetooth = feature('bt', 'presence-sensor', 'push');
    expect(occupancySensor.claim([bluetooth])).to.deep.equal([]);
  });
});
