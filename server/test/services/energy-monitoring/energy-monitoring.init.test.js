const { fake, assert, useFakeTimers } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');

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

describe('EnergyMonitoring.init', () => {
  let stateManager;
  let serviceManager;
  let device;
  let gladys;
  let energyMonitoring;
  let mockScheduler;

  beforeEach(async () => {
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);

    // Mock scheduler
    mockScheduler = {
      scheduleJob: fake.returns('mock-job-id'),
    };

    gladys = {
      variable,
      device,
      scheduler: mockScheduler,
      job: {
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });

  it('should schedule both energy monitoring jobs on first init', () => {
    energyMonitoring.init();

    // Verify both jobs are scheduled
    assert.calledTwice(mockScheduler.scheduleJob);

    // Verify cost calculation job (every 30 minutes)
    const costJobCall = mockScheduler.scheduleJob.getCall(0);
    expect(costJobCall.args[0]).to.equal('0 */30 * * * *');
    expect(typeof costJobCall.args[1]).to.equal('function');

    // Verify consumption calculation job (at 00:00 and 00:30)
    const consumptionJobCall = mockScheduler.scheduleJob.getCall(1);
    expect(consumptionJobCall.args[0]).to.equal('0 0,30 * * * *');
    expect(typeof consumptionJobCall.args[1]).to.equal('function');

    // Verify job IDs are stored
    expect(energyMonitoring.calculateEnergyMonitoringEvery30MinutesJob).to.equal('mock-job-id');
    expect(energyMonitoring.calculateConsumptionFromIndexEvery30MinutesJob).to.equal('mock-job-id');
  });

  it('should not schedule jobs again if already scheduled', () => {
    // Set existing job IDs
    energyMonitoring.calculateEnergyMonitoringEvery30MinutesJob = 'existing-cost-job';
    energyMonitoring.calculateConsumptionFromIndexEvery30MinutesJob = 'existing-consumption-job';

    energyMonitoring.init();

    // Verify no new jobs are scheduled
    assert.notCalled(mockScheduler.scheduleJob);

    // Verify existing job IDs are preserved
    expect(energyMonitoring.calculateEnergyMonitoringEvery30MinutesJob).to.equal('existing-cost-job');
    expect(energyMonitoring.calculateConsumptionFromIndexEvery30MinutesJob).to.equal('existing-consumption-job');
  });

  it('should schedule only missing jobs if one exists', () => {
    // Set only cost calculation job
    energyMonitoring.calculateEnergyMonitoringEvery30MinutesJob = 'existing-cost-job';

    energyMonitoring.init();

    // Verify only consumption job is scheduled
    assert.calledOnce(mockScheduler.scheduleJob);

    const consumptionJobCall = mockScheduler.scheduleJob.getCall(0);
    expect(consumptionJobCall.args[0]).to.equal('0 0,30 * * * *');

    // Verify existing job ID is preserved and new one is set
    expect(energyMonitoring.calculateEnergyMonitoringEvery30MinutesJob).to.equal('existing-cost-job');
    expect(energyMonitoring.calculateConsumptionFromIndexEvery30MinutesJob).to.equal('mock-job-id');
  });

  describe('Scheduled job execution', () => {
    let calculateCostEveryThirtyMinutes;
    let calculateConsumptionFromIndex;

    beforeEach(() => {
      calculateCostEveryThirtyMinutes = fake.returns(null);
      calculateConsumptionFromIndex = fake.returns(null);

      energyMonitoring.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
      energyMonitoring.calculateConsumptionFromIndex = calculateConsumptionFromIndex;
    });

    it('should execute cost calculation when cost job runs', () => {
      energyMonitoring.init();

      // Get the cost calculation job function
      const costJobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job
      costJobFunction();

      // Verify cost calculation was called
      assert.calledOnce(calculateCostEveryThirtyMinutes);
      assert.notCalled(calculateConsumptionFromIndex);
    });

    it('should execute consumption calculation with correct timestamp when consumption job runs', () => {
      energyMonitoring.init();

      // Get the consumption calculation job function
      const consumptionJobFunction = mockScheduler.scheduleJob.getCall(1).args[1];

      // Execute the job (it will use current time)
      consumptionJobFunction();

      // Verify consumption calculation was called
      assert.calledOnce(calculateConsumptionFromIndex);
      assert.notCalled(calculateCostEveryThirtyMinutes);

      const callArgs = calculateConsumptionFromIndex.getCall(0).args;
      expect(callArgs[0]).to.equal(null); // jobId
      expect(callArgs[1]).to.be.instanceOf(Date); // thirtyMinutesWindowTime

      // Verify timestamp has correct minutes (should be 0 or 30)
      const minutes = callArgs[1].getMinutes();
      expect([0, 30]).to.include(minutes);

      // Verify seconds and milliseconds are 0
      expect(callArgs[1].getSeconds()).to.equal(0);
      expect(callArgs[1].getMilliseconds()).to.equal(0);
    });

    it('should create timestamp with proper rounding logic', () => {
      energyMonitoring.init();

      // Get the consumption calculation job function
      const consumptionJobFunction = mockScheduler.scheduleJob.getCall(1).args[1];

      // Execute the job multiple times to test rounding
      consumptionJobFunction();

      // Verify consumption calculation was called
      assert.calledOnce(calculateConsumptionFromIndex);

      const callArgs = calculateConsumptionFromIndex.getCall(0).args;
      expect(callArgs[0]).to.equal(null); // jobId
      expect(callArgs[1]).to.be.instanceOf(Date); // thirtyMinutesWindowTime

      // Verify the timestamp is properly rounded
      const timestamp = callArgs[1];
      const minutes = timestamp.getMinutes();
      const seconds = timestamp.getSeconds();
      const milliseconds = timestamp.getMilliseconds();

      // Minutes should be 0 or 30
      expect([0, 30]).to.include(minutes);
      // Seconds and milliseconds should be 0 (exact time)
      expect(seconds).to.equal(0);
      expect(milliseconds).to.equal(0);
    });

    it('should round to 00:00 when current time is before 30 minutes', () => {
      // Use sinon fake timers to mock a time with minutes < 30 (e.g., 10:15:45.123)
      const clock = useFakeTimers(new Date('2023-10-15T10:15:45.123Z'));

      try {
        energyMonitoring.init();

        // Get the consumption calculation job function
        const consumptionJobFunction = mockScheduler.scheduleJob.getCall(1).args[1];

        // Execute the job
        consumptionJobFunction();

        // Verify consumption calculation was called with rounded time
        assert.calledOnce(calculateConsumptionFromIndex);

        const callArgs = calculateConsumptionFromIndex.getCall(0).args;
        const timestamp = callArgs[1];

        // Should round to 00:00
        expect(timestamp.getMinutes()).to.equal(0);
        expect(timestamp.getSeconds()).to.equal(0);
        expect(timestamp.getMilliseconds()).to.equal(0);
      } finally {
        clock.restore();
      }
    });

    it('should round to 00:30 when current time is at or after 30 minutes', () => {
      // Use sinon fake timers to mock a time with minutes >= 30 (e.g., 10:45:30.456)
      const clock = useFakeTimers(new Date('2023-10-15T10:45:30.456Z'));

      try {
        energyMonitoring.init();

        // Get the consumption calculation job function
        const consumptionJobFunction = mockScheduler.scheduleJob.getCall(1).args[1];

        // Execute the job
        consumptionJobFunction();

        // Verify consumption calculation was called with rounded time
        assert.calledOnce(calculateConsumptionFromIndex);

        const callArgs = calculateConsumptionFromIndex.getCall(0).args;
        const timestamp = callArgs[1];

        // Should round to 00:30
        expect(timestamp.getMinutes()).to.equal(30);
        expect(timestamp.getSeconds()).to.equal(0);
        expect(timestamp.getMilliseconds()).to.equal(0);
      } finally {
        clock.restore();
      }
    });
  });
});
