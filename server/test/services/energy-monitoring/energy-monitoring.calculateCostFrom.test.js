const { fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const db = require('../../../models');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
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
  getValue: fake.resolves(null),
};

describe('EnergyMonitoring.calculateCostFrom', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  it('should calculate cost from a specific date for a base contract', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);
    const energyPrice = new EnergyPrice();
    // We create a new electrical meter device
    const electricalMeterDevice = await device.create({
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
    await energyPrice.create({
      electric_meter_device_id: electricalMeterDevice.id,
      contract: 'base',
      price_type: 'consumption',
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
    const gladys = {
      device,
      energyPrice,
      job: {
        wrapper: (func) => func,
      },
    };
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
});
