const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const ServiceManager = require('../../../../lib/service');
const Job = require('../../../../lib/job');
const EnergyContract = require('../../../../lib/energy-contract');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../../utils/constants');

const METER_DEVICE_ID = 'd1fe2ab9-8c50-4053-ac40-83421f899c59';
const METER_FEATURE_ID = '101d2306-b15e-4859-b403-a076167eadd9';
const METER_CONSUMPTION_FEATURE_ID = '17488546-e1b8-4cb9-bd75-e20526a94a99';
const METER_COST_FEATURE_ID = '0f4133be-b86c-4a97-9cc8-585fadb74006';
const TEST_SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

const BASE_TARIFF = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } },
    { key: 'subscription', kind: 'fixed', amount: 12, per: 'month' },
  ],
};

const TEMPO_TARIFF = {
  tariff_version: 1,
  calendars: ['tempo'],
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [
        { label: 'Red peak', when: { calendar: { tempo: 'red' }, time: [['06:00', '22:00']] }, price: 0.7562 },
        { label: 'Red off-peak', when: { calendar: { tempo: 'red' } }, price: 0.1568 },
        { label: 'Blue peak', when: { calendar: { tempo: 'blue' }, time: [['06:00', '22:00']] }, price: 0.1609 },
      ],
      fallback: { label: 'Blue off-peak', price: 0.1296 },
    },
  ],
};

/**
 * @description Build an energy contract manager on the test database, with a real device
 * manager and a root meter device carrying a 30-minute consumption and its cost feature.
 * @param {object} [options] - `timezone` of the fake system variable.
 * @returns {Promise<object>} { energyContract, event, stateManager, device, variable, meter }.
 * @example
 * const { energyContract } = await buildManager();
 */
async function buildManager(options = {}) {
  await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  const event = new EventEmitter();
  const stateManager = new StateManager(event);
  const serviceManager = new ServiceManager({}, stateManager);
  const job = new Job(event);
  const brain = { addNamedEntity: sinon.fake.returns(null), removeNamedEntity: sinon.fake.returns(null) };
  const variables = { [SYSTEM_VARIABLE_NAMES.TIMEZONE]: options.timezone || 'Europe/Paris' };
  const variable = {
    getValue: sinon.fake((name) => Promise.resolve(variables[name] === undefined ? null : variables[name])),
    setValue: sinon.fake((name, value) => {
      variables[name] = value;
      return Promise.resolve(null);
    }),
  };
  const device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);
  const meter = await device.create({
    id: METER_DEVICE_ID,
    service_id: TEST_SERVICE_ID,
    name: 'Electrical Meter',
    external_id: 'electrical-meter',
    selector: 'electrical-meter',
    features: [
      {
        id: METER_FEATURE_ID,
        external_id: 'electrical-meter-index',
        selector: 'electrical-meter-index',
        name: 'Index',
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 100000,
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
      },
      {
        id: METER_CONSUMPTION_FEATURE_ID,
        external_id: 'electrical-meter-consumption',
        selector: 'electrical-meter-consumption',
        name: 'Consumption',
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 1000,
        unit: 'kWh',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        energy_parent_id: METER_FEATURE_ID,
      },
      {
        id: METER_COST_FEATURE_ID,
        external_id: 'electrical-meter-cost',
        selector: 'electrical-meter-cost',
        name: 'Cost',
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 1000,
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        energy_parent_id: METER_CONSUMPTION_FEATURE_ID,
      },
    ],
  });
  const energyContract = new EnergyContract(event, stateManager, serviceManager, device, variable);
  return { energyContract, event, stateManager, serviceManager, device, variable, meter, variables };
}

/**
 * @description Insert 30-minute consumption states of the test meter.
 * @param {Array<object>} states - [{ value, created_at }].
 * @returns {Promise<void>} Resolves when inserted.
 * @example
 * await insertConsumption([{ value: 1, created_at: new Date('2026-01-12T12:30:00Z') }]);
 */
async function insertConsumption(states) {
  await db.duckDbBatchInsertState(METER_CONSUMPTION_FEATURE_ID, states);
}

/**
 * @description A minimal valid contract payload for the test meter.
 * @param {object} [overrides] - Fields to override.
 * @returns {object} The payload.
 * @example
 * contractPayload({ name: 'Other' });
 */
function contractPayload(overrides = {}) {
  return {
    name: 'EDF Base',
    electric_meter_device_id: METER_DEVICE_ID,
    valid_from: '2025-01-01',
    currency: 'EUR',
    tariff: BASE_TARIFF,
    ...overrides,
  };
}

module.exports = {
  buildManager,
  insertConsumption,
  contractPayload,
  BASE_TARIFF,
  TEMPO_TARIFF,
  METER_DEVICE_ID,
  METER_FEATURE_ID,
  METER_CONSUMPTION_FEATURE_ID,
  METER_COST_FEATURE_ID,
  TEST_SERVICE_ID,
};
