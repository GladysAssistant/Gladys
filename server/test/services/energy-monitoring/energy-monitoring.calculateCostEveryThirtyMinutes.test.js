const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const EventEmitter = require('events');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const EnergyPrice = require('../../../lib/energy-price');
const {
  buildCostThirtyMinutesJobData,
} = require('../../../services/energy-monitoring/lib/energy-monitoring.calculateCostEveryThirtyMinutes');

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

describe('EnergyMonitoring.calculateCostEveryThirtyMinutes', () => {
  let stateManager;
  let serviceManager;
  let device;
  let energyPrice;
  let gladys;

  beforeEach(async () => {
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
        wrapperDetached: (name, func) => func,
      },
    };
  });
  it('should calculate cost every thirty minutes', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    energyMonitoring.calculateCostFrom = fake.returns(null);
    await energyMonitoring.calculateCostEveryThirtyMinutes('12345678-1234-1234-1234-1234567890ab');
    assert.calledOnce(energyMonitoring.calculateCostFrom);
  });

  it('should build job data for thirty-minute cost window', () => {
    const now = new Date('2025-03-10T12:18:00.000Z');
    const data = buildCostThirtyMinutesJobData(now);
    expect(data).to.deep.equal({
      scope: 'all',
      period: {
        start_date: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        end_date: now.toISOString(),
      },
      kind: 'cost',
    });
  });
});
