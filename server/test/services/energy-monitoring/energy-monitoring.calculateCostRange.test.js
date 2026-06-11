const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EventEmitter = require('events');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

describe('EnergyMonitoring.calculateCostRange', () => {
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

  it('should forward parameters to calculateCostFrom', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    energyMonitoring.calculateCostFrom = fake.resolves(null);

    await energyMonitoring.calculateCostRange('2025-01-01', ['feature-1'], '2025-01-31', 'job-123');

    assert.calledOnceWithExactly(
      energyMonitoring.calculateCostFrom,
      '2025-01-01',
      ['feature-1'],
      'job-123',
      '2025-01-31',
    );
  });

  it('should default start date when not provided', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    energyMonitoring.calculateCostFrom = fake.resolves(null);

    await energyMonitoring.calculateCostRange(null, [], null, 'job-abc');

    assert.calledOnce(energyMonitoring.calculateCostFrom);
    const { args } = energyMonitoring.calculateCostFrom.firstCall;
    expect(args[0]).to.be.instanceOf(Date);
    expect(args[1]).to.deep.equal([]);
    expect(args[2]).to.equal('job-abc');
    expect(args[3]).to.equal(null);
  });
});
