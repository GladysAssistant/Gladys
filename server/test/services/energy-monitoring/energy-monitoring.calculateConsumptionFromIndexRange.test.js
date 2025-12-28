const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

describe('EnergyMonitoring.calculateConsumptionFromIndexRange', () => {
  let gladys;

  beforeEach(() => {
    const event = new EventEmitter();
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const job = new Job(event);
    const brain = {
      addNamedEntity: fake.returns(null),
      removeNamedEntity: fake.returns(null),
    };
    const variable = {
      getValue: fake.resolves('Europe/Paris'),
    };
    const device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);

    gladys = {
      variable,
      device,
      job: {
        wrapper: (name, func) => func,
        wrapperDetached: (name, func) => func,
        updateProgress: fake.returns(null),
      },
    };
  });

  it('should return null when no devices to process', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    gladys.device.get = fake.resolves([]);

    const res = await energyMonitoring.calculateConsumptionFromIndexRange(
      '2025-01-01',
      ['consumption-selector'],
      '2025-01-10',
      'job-123',
    );

    expect(res).to.equal(null);
    expect(gladys.job.updateProgress.called).to.equal(false);
  });
});
