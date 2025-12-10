const { fake, assert } = require('sinon');
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

describe('EnergyMonitoring.calculateCostFromBeginning', () => {
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
      },
    };
  });
  it('should calculate cost from beginning', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    energyMonitoring.calculateCostFrom = fake.returns(null);
    await energyMonitoring.calculateCostFromBeginning('12345678-1234-1234-1234-1234567890ab');
    assert.calledWith(energyMonitoring.calculateCostFrom, new Date(0), '12345678-1234-1234-1234-1234567890ab');
  });
});
