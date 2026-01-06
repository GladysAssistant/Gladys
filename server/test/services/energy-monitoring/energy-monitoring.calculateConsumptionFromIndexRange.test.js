const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const EventEmitter = require('events');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

describe('EnergyMonitoring.calculateConsumptionFromIndexRange', () => {
  let gladys;
  let clock;

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

  afterEach(() => {
    if (clock) {
      clock.restore();
      clock = null;
    }
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

  it('should return null when dates are invalid', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const res = await energyMonitoring.calculateConsumptionFromIndexRange({}, [], '2025-01-02', 'job-1');
    expect(res).to.equal(null);
    expect(gladys.job.updateProgress.called).to.equal(false);
  });

  it('should process devices and update progress', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };

    const indexFeatureId = 'index-id';
    const consumptionFeatureId = 'cons-id';
    gladys.device.get = fake.resolves([
      {
        id: 'device-id',
        name: 'Device A',
        params: [{ name: 'ENERGY_INDEX_LAST_PROCESSED', value: '2024-01-01T00:00:00.000Z' }],
        features: [
          { id: indexFeatureId, selector: 'index-selector', category: 'energy-sensor', type: 'index' },
          {
            id: consumptionFeatureId,
            selector: 'cons-selector',
            external_id: 'cons-external',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexFeatureId,
          },
        ],
      },
    ]);

    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00.000Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    gladys.device.destroyStatesFrom = fake.resolves(null);
    gladys.device.destroyParam = fake.resolves(null);
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.resolves(null);

    const result = await energyMonitoring.calculateConsumptionFromIndexRange(
      '2025-06-17',
      ['cons-selector'],
      '2025-06-18',
      'job-xyz',
    );

    expect(result).to.equal(null);
    expect(energyMonitoring.calculateConsumptionFromIndex.callCount).to.be.greaterThan(0);
    const progressCalls = gladys.job.updateProgress.getCalls();
    expect(progressCalls.length).to.be.greaterThan(1);
    expect(progressCalls[0].args[0]).to.equal('job-xyz');
    expect(progressCalls[progressCalls.length - 1].args[1]).to.equal(100);
  });

  it('should handle Date inputs and return null when start after end', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: 'idx1', category: 'energy-sensor', type: 'index' },
          { id: 'cons1', category: 'energy-sensor', type: 'thirty-minutes-consumption', energy_parent_id: 'idx1' },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([]);
    const res = await energyMonitoring.calculateConsumptionFromIndexRange(
      new Date('2025-01-10T00:00:00Z'),
      [],
      '2025-01-05',
      'job-date',
    );
    expect(res).to.equal(null);
    expect(gladys.job.updateProgress.called).to.equal(false);
  });

  it('should return null when no start date and no states', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: 'idx1', category: 'energy-sensor', type: 'index' },
          { id: 'cons1', category: 'energy-sensor', type: 'thirty-minutes-consumption', energy_parent_id: 'idx1' },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([]);
    const res = await energyMonitoring.calculateConsumptionFromIndexRange(null, [], null, 'job-no-start');
    expect(res).to.equal(null);
    expect(gladys.job.updateProgress.called).to.equal(false);
  });

  it('should accept all features when selector list empty and skip features without selector', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const indexId = 'idx1';
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: indexId, category: 'energy-sensor', type: 'index' },
          {
            id: 'cons-has',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
            selector: 'cons-has',
          },
          {
            id: 'cons-missing',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
          },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    gladys.device.destroyStatesFrom = fake.resolves(null);
    gladys.device.destroyParam = fake.resolves(null);
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.resolves(null);

    await energyMonitoring.calculateConsumptionFromIndexRange('2025-06-17', [], '2025-06-17', 'job-empty-selectors');

    expect(gladys.device.destroyStatesBetween.calledOnce).to.equal(true);
    // feature without selector should not trigger destroyStatesBetween
    const args = gladys.device.destroyStatesBetween.getCall(0).args[0];
    expect(args).to.equal('cons-has');
  });

  it('should destroy states from when no end date provided', async () => {
    clock = sinon.useFakeTimers(new Date('2025-06-17T01:00:00Z').getTime());
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const indexId = 'idx1';
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: indexId, category: 'energy-sensor', type: 'index' },
          {
            id: 'cons',
            selector: 'cons',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
          },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    const destroyStatesFromStub = fake.resolves(null);
    gladys.device.destroyStatesFrom = destroyStatesFromStub;
    gladys.device.destroyParam = fake.resolves(null);
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.resolves(null);

    await energyMonitoring.calculateConsumptionFromIndexRange('2025-06-17', ['cons'], null, 'job-no-end');

    expect(destroyStatesFromStub.calledOnce).to.equal(true);
    expect(gladys.device.destroyStatesBetween.called).to.equal(false);
  });

  it('should continue processing on window error and update progress in catch', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const indexId = 'idx1';
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: indexId, category: 'energy-sensor', type: 'index' },
          {
            id: 'cons',
            selector: 'cons',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
          },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    gladys.device.destroyStatesFrom = fake.resolves(null);
    gladys.device.destroyParam = fake.resolves(null);
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.rejects(new Error('fail-window'));

    await energyMonitoring.calculateConsumptionFromIndexRange('2025-06-17', ['cons'], '2025-06-17', 'job-error');

    expect(gladys.job.updateProgress.called).to.equal(true);
    const lastCall = gladys.job.updateProgress.getCalls().pop();
    expect(lastCall.args[1]).to.equal(100);
  });

  it('should adjust start date to oldest state when provided start is earlier', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const indexId = 'idx1';
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: indexId, category: 'energy-sensor', type: 'index' },
          {
            id: 'cons',
            selector: 'cons',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
          },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    gladys.device.destroyStatesFrom = fake.resolves(null);
    gladys.device.destroyParam = fake.resolves(null);
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.resolves(null);

    await energyMonitoring.calculateConsumptionFromIndexRange('2025-06-01', ['cons'], '2025-06-17', 'job-adjust');

    expect(gladys.device.destroyStatesBetween.calledOnce).to.equal(true);
  });

  it('should destroy param when no original last processed value', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const indexId = 'idx1';
    gladys.device.get = fake.resolves([
      {
        id: 'dev-1',
        params: [],
        features: [
          { id: indexId, category: 'energy-sensor', type: 'index' },
          {
            id: 'cons',
            selector: 'cons',
            category: 'energy-sensor',
            type: 'thirty-minutes-consumption',
            energy_parent_id: indexId,
          },
        ],
      },
    ]);
    gladys.device.getOldestStateFromDeviceFeatures = fake.resolves([
      { oldest_created_at: new Date('2025-06-16T22:00:00Z') },
    ]);
    gladys.device.destroyStatesBetween = fake.resolves(null);
    gladys.device.destroyStatesFrom = fake.resolves(null);
    const destroyParamStub = fake.resolves(null);
    gladys.device.destroyParam = destroyParamStub;
    gladys.device.setParam = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = fake.resolves(null);

    await energyMonitoring.calculateConsumptionFromIndexRange('2025-06-17', ['cons'], '2025-06-20', 'job-restore');

    expect(destroyParamStub.called).to.equal(true);
  });
});
