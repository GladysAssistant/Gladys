const { fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const db = require('../../../models');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ENERGY_CONTRACT_TYPES,
  ENERGY_PRICE_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const EnergyPrice = require('../../../lib/energy-price');

const event = new EventEmitter();
const job = new Job(event);

const brain = {
  addNamedEntity: fake.returns(null),
  removeNamedEntity: fake.returns(null),
};
const variable = {
  getValue: (name) => {
    if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
      return 'Europe/Paris';
    }
    return null;
  },
};

describe('EnergyMonitoring.calculateCostFrom', () => {
  let stateManager;
  let serviceManager;
  let device;
  let energyPrice;
  let electricalMeterDevice;
  let gladys;
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);
    energyPrice = new EnergyPrice();
    gladys = {
      variable,
      device,
      energyPrice,
      job: {
        wrapper: (func) => func,
      },
    };
    // We create a new electrical meter device
    electricalMeterDevice = await device.create({
      id: 'd1fe2ab9-8c50-4053-ac40-83421f899c59',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Electrical Meter',
      external_id: 'electrical-meter',
      selector: 'electrical-meter',
      features: [
        {
          id: '101d2306-b15e-4859-b403-a076167eadd9',
          external_id: 'electrical-meter-feature',
          selector: 'electrical-meter-feature',
          name: 'Electrical Meter',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
        },
      ],
    });
    // We create a new device with consumption & consumption cost
    await device.create({
      id: 'cf43f956-2f49-4cf9-a7e2-690a014de66e',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Power plug',
      external_id: 'power-plug',
      features: [
        {
          id: '17488546-e1b8-4cb9-bd75-e20526a94a99',
          selector: 'power-plug-consumption',
          external_id: 'power-plug-consumption',
          name: 'Power plug Consumption',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: '101d2306-b15e-4859-b403-a076167eadd9',
        },
        {
          id: '0f4133be-b86c-4a97-9cc8-585fadb74006',
          selector: 'power-plug-consumption-cost',
          external_id: 'power-plug-consumption-cost',
          name: 'Power plug Consumption Cost',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: '101d2306-b15e-4859-b403-a076167eadd9',
        },
      ],
    });
  });
  it('should calculate cost from a specific date for a base contract', async () => {
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.BASE,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      // 0,18€/kwh stored as integer in cents
      price: 18,
    });
    await db.duckDbBatchInsertState('17488546-e1b8-4cb9-bd75-e20526a94a99', [
      {
        value: 10,
        created_at: new Date('2025-08-28T15:00:00.000Z'),
      },
      {
        value: 20,
        created_at: new Date('2025-08-28T15:01:00.000Z'),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date);
    const deviceFeatureState = await device.getDeviceFeatureStates(
      'power-plug-consumption-cost',
      new Date('2025-01-01T00:00:00.000Z'),
      new Date('2025-12-01T00:00:00.000Z'),
    );
    expect(deviceFeatureState).to.have.lengthOf(2);
    // Price should be equal to 0.18€/kwh * 10kwh
    expect(deviceFeatureState[0]).to.have.property('value', 10 * 0.18);
    // Price should be equal to 0.18€/kwh * 20kwh
    expect(deviceFeatureState[1]).to.have.property('value', 20 * 0.18);
  });
  it('should calculate cost from a specific date for a peak/off peak contract', async () => {
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      // 0,15€/kwh stored as integer in cents
      price: 15,
      // Off peak time
      hour_slots: '1,2,3,4,5,6,22,23',
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      // 0,25€/kwh stored as integer in cents
      price: 25,
      // Peak time
      hour_slots: '7,8,9,10,11,12,13,14,15,16,17,18,19,20,21',
    });
    await db.duckDbBatchInsertState('17488546-e1b8-4cb9-bd75-e20526a94a99', [
      {
        value: 10,
        // Create date in Paris timezone
        created_at: dayjs.tz('2025-08-28T05:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 20,
        // Create date in Paris timezone
        created_at: dayjs.tz('2025-08-28T15:30:00.000Z', 'Europe/Paris').toDate(),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date);
    const deviceFeatureState = await device.getDeviceFeatureStates(
      'power-plug-consumption-cost',
      dayjs.tz('2025-01-01T00:00:00.000Z', 'Europe/Paris').toDate(),
      dayjs.tz('2025-12-01T00:00:00.000Z', 'Europe/Paris').toDate(),
    );
    expect(deviceFeatureState).to.have.lengthOf(2);
    // Price should be equal to 0.15€/kwh * 10kwh
    expect(deviceFeatureState[0]).to.have.property('value', 10 * 0.15);
    // Price should be equal to 0.25€/kwh * 20kwh
    expect(deviceFeatureState[1]).to.have.property('value', 20 * 0.25);
  });
});
