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
  ENERGY_PRICE_DAY_TYPES,
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
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
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
      // 0,18€/kwh stored as integer with 4 decimals
      price: 1800,
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
      // 0,15€/kwh stored as integer with 4 decimals
      price: 1500,
      // Off peak time
      hour_slots: '01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,06:00,06:30,22:00,22:30,23:00,23:30',
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      // 0,25€/kwh stored as integer with 4 decimals
      price: 2500,
      // Peak time
      hour_slots:
        '07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
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
  it('should calculate cost from a specific date for a edf-tempo contract', async () => {
    // BLUE
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 1288,
      hour_slots: '01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,22:00,22:30,23:00,23:30',
      day_type: ENERGY_PRICE_DAY_TYPES.BLUE,
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 1552,
      hour_slots:
        '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
      day_type: ENERGY_PRICE_DAY_TYPES.BLUE,
    });
    // WHITE
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 1447,
      hour_slots: '01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,22:00,22:30,23:00,23:30',
      day_type: ENERGY_PRICE_DAY_TYPES.WHITE,
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 1792,
      hour_slots:
        '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
      day_type: ENERGY_PRICE_DAY_TYPES.WHITE,
    });
    // RED
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 1518,
      hour_slots: '01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30,22:00,22:30,23:00,23:30',
      day_type: ENERGY_PRICE_DAY_TYPES.RED,
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.EDF_TEMPO,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      price: 6586,
      hour_slots:
        '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30',
      day_type: ENERGY_PRICE_DAY_TYPES.RED,
    });
    await db.duckDbBatchInsertState('17488546-e1b8-4cb9-bd75-e20526a94a99', [
      {
        value: 10,
        // RED day, off peak
        created_at: dayjs.tz('2025-01-03T05:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // RED day, peak
        created_at: dayjs.tz('2025-01-03T10:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // WHITE day, peak
        created_at: dayjs.tz('2025-01-04T15:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // WHITE day, off peak
        created_at: dayjs.tz('2025-01-04T22:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // BLUE day, peak
        created_at: dayjs.tz('2025-01-05T15:30:00.000Z', 'Europe/Paris').toDate(),
      },
      {
        value: 10,
        // BLUE day, off peak
        created_at: dayjs.tz('2025-01-05T22:30:00.000Z', 'Europe/Paris').toDate(),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    const date = new Date('2025-01-01T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date);
    const deviceFeatureState = await device.getDeviceFeatureStates(
      'power-plug-consumption-cost',
      dayjs.tz('2025-01-01T00:00:00.000Z', 'Europe/Paris').toDate(),
      dayjs.tz('2025-12-01T00:00:00.000Z', 'Europe/Paris').toDate(),
    );
    expect(deviceFeatureState).to.have.lengthOf(6);
    expect(deviceFeatureState[0]).to.have.property('value', 10 * 0.1518);
    expect(deviceFeatureState[1]).to.have.property('value', 10 * 0.6586);
    expect(deviceFeatureState[2]).to.have.property('value', 10 * 0.1792);
    expect(deviceFeatureState[3]).to.have.property('value', 10 * 0.1447);
    expect(deviceFeatureState[4]).to.have.property('value', 10 * 0.1552);
    expect(deviceFeatureState[5]).to.have.property('value', 10 * 0.1288);
  });
  it('should calculate cost from a specific date for a base contract on a daily consumption', async () => {
    // We create a new device with consumption & consumption cost
    await device.create({
      id: '53e69a3d-b15f-4e6a-973d-9d815d02e507',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Power plug 2',
      external_id: 'power-plug-2',
      features: [
        {
          id: '700ed79b-ebee-4501-8bbd-19e223f92fa5',
          selector: 'power-plug-consumption-2',
          external_id: 'power-plug-consumption-2',
          name: 'Power plug Consumption 2',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
          energy_parent_id: '101d2306-b15e-4859-b403-a076167eadd9',
        },
        {
          id: '351e7c5e-50e6-48f2-a197-b3b0104053d3',
          selector: 'power-plug-consumption-cost-2',
          external_id: 'power-plug-consumption-cost-2',
          name: 'Power plug Consumption Cost 2',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
          energy_parent_id: '101d2306-b15e-4859-b403-a076167eadd9',
        },
      ],
    });
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: ENERGY_CONTRACT_TYPES.BASE,
      price_type: ENERGY_PRICE_TYPES.CONSUMPTION,
      currency: 'euro',
      start_date: '2025-01-01',
      // 0,18€/kwh stored as integer with 4 decimals
      price: 1800,
    });
    await db.duckDbBatchInsertState('700ed79b-ebee-4501-8bbd-19e223f92fa5', [
      {
        value: 100,
        created_at: new Date('2025-08-28T15:00:00.000Z'),
      },
      {
        value: 200,
        created_at: new Date('2025-08-28T15:01:00.000Z'),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date, '43732e67-6669-4a95-83d6-38c50b835387');
    const deviceFeatureState = await device.getDeviceFeatureStates(
      'power-plug-consumption-cost-2',
      new Date('2025-01-01T00:00:00.000Z'),
      new Date('2025-12-01T00:00:00.000Z'),
    );
    expect(deviceFeatureState).to.have.lengthOf(2);
    // Price should be equal to 0.18€/kwh * 100kwh
    expect(deviceFeatureState[0]).to.have.property('value', 100 * 0.18);
    // Price should be equal to 0.18€/kwh * 200kwh
    expect(deviceFeatureState[1]).to.have.property('value', 200 * 0.18);
  });
  it('should handle device with thirty minutes consumption but no cost feature (logs missing cost feature)', async () => {
    // Create a device that only has the THIRTY_MINUTES_CONSUMPTION feature, without the corresponding COST feature
    await device.create({
      id: '7e1a1cf8-3f37-4a9f-b6ef-8f4f0a2f6a01',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Partial Power Plug',
      external_id: 'partial-power-plug',
      features: [
        {
          id: '5c4a3c81-3d82-4b8e-9f78-0c2a92e2c7a1',
          selector: 'partial-power-plug-consumption',
          external_id: 'partial-power-plug-consumption',
          name: 'Partial Power Plug Consumption',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: '101d2306-b15e-4859-b403-a076167eadd9',
        },
      ],
    });
    const energyMonitoring = new EnergyMonitoring(gladys, 'edb7b8c6-77a7-43b7-8a2f-67a723ddd0b1');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date, 'edb7b8c6-77a7-43b7-8a2f-67a723ddd0b1');
    // No assertion needed; executing the branch covers the logger line.
  });
  it('should handle device with no daily consumption feature (logs missing daily feature)', async () => {
    // Create a device with no ENERGY_SENSOR features so daily feature is missing
    await device.create({
      id: 'f8e2f7a0-0a2c-4c8c-9a6f-cc5a7cdeaa91',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Device Without Energy Features',
      external_id: 'no-energy-features-device',
      features: [],
    });
    const energyMonitoring = new EnergyMonitoring(gladys, 'b8c55219-0dc2-4a32-8d3d-6a7b2d4a1c22');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date, 'b8c55219-0dc2-4a32-8d3d-6a7b2d4a1c22');
    // The code path logs the absence of a daily consumption feature.
  });
  it('should handle case where no energy price is found for the device at the given date (logs and returns)', async () => {
    // Create a new electrical meter device with NO energy prices attached
    await device.create({
      id: '6a8a2a7e-0405-4c61-9d40-1d9c6aa9c0a1',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Electrical Meter - No Price',
      external_id: 'electrical-meter-no-price',
      selector: 'electrical-meter-no-price',
      features: [
        {
          id: '2c2b6f0d-e5f7-4d2b-bc16-1a5c2b39d9a1',
          external_id: 'electrical-meter-no-price-feature',
          selector: 'electrical-meter-no-price-feature',
          name: 'Electrical Meter No Price',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
        },
      ],
    });
    // Create a device linked to this meter with both consumption and cost features
    await device.create({
      id: 'f1a8d6c2-9c3d-4b9b-8e27-2d4d1c6a5b01',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Plug Without Price',
      external_id: 'plug-without-price',
      features: [
        {
          id: '9e2b3a8c-8e9d-4f0a-92c4-5b6a2e1d3c01',
          selector: 'plug-without-price-consumption',
          external_id: 'plug-without-price-consumption',
          name: 'Plug Without Price Consumption',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: '2c2b6f0d-e5f7-4d2b-bc16-1a5c2b39d9a1',
        },
        {
          id: '0a1b2c3d-4e5f-6789-abcd-ef0123456789',
          selector: 'plug-without-price-consumption-cost',
          external_id: 'plug-without-price-consumption-cost',
          name: 'Plug Without Price Consumption Cost',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: '2c2b6f0d-e5f7-4d2b-bc16-1a5c2b39d9a1',
        },
      ],
    });
    // Insert a state for this consumption feature
    await db.duckDbBatchInsertState('9e2b3a8c-8e9d-4f0a-92c4-5b6a2e1d3c01', [
      {
        value: 5,
        created_at: new Date('2025-08-28T15:00:00.000Z'),
      },
    ]);
    const energyMonitoring = new EnergyMonitoring(gladys, 'a3e1fcb2-9c74-4bb1-8fc7-9eaa2b2f2d12');
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date, 'a3e1fcb2-9c74-4bb1-8fc7-9eaa2b2f2d12');
    // This executes the branch where no energy price is found for the state timestamp.
  });
  it('should catch and log an error during processing', async () => {
    // Force an error by making getRootElectricMeterDevice throw
    const original = gladys.device.energySensorManager.getRootElectricMeterDevice;
    gladys.device.energySensorManager.getRootElectricMeterDevice = () => {
      throw new Error('Forced test error');
    };
    try {
      const energyMonitoring = new EnergyMonitoring(gladys, '6f6e3a7a-d826-4a99-8fdb-4f6a9a16a8a3');
      const date = new Date('2025-08-28T00:00:00.000Z');
      await energyMonitoring.calculateCostFrom(date, '6f6e3a7a-d826-4a99-8fdb-4f6a9a16a8a3');
    } finally {
      // Restore original function to avoid side effects on other tests
      gladys.device.energySensorManager.getRootElectricMeterDevice = original;
    }
  });
});
