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

  it('should return null when dates are invalid', async () => {
    const energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    energyMonitoring.queue = { push: (fn) => fn() };
    const res = await energyMonitoring.calculateConsumptionFromIndexRange({}, [], '2025-01-02', 'job-1');
    expect(res).to.equal(null);
    expect(gladys.job.updateProgress.called).to.equal(false);
  });

  it('should process devices, update progress and include current_date', async () => {
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
    expect(progressCalls[0].args[2].current_date).to.not.equal(undefined);
    expect(progressCalls[progressCalls.length - 1].args[2].current_date).to.equal(null);
  });
});
