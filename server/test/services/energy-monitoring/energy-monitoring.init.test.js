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

  it('should schedule combined energy monitoring job on first init', () => {
    energyMonitoring.init();

    // Verify job is scheduled
    assert.calledOnce(mockScheduler.scheduleJob);

    // Verify combined job (at 00:00 and 00:30)
    const jobCall = mockScheduler.scheduleJob.getCall(0);
    expect(jobCall.args[0]).to.equal('0 0,30 * * * *');
    expect(typeof jobCall.args[1]).to.equal('function');

    // Verify job ID is stored
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('mock-job-id');
  });

  it('should not schedule job again if already scheduled', () => {
    // Set existing job ID
    energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob = 'existing-job';

    energyMonitoring.init();

    // Verify no new job is scheduled
    assert.notCalled(mockScheduler.scheduleJob);

    // Verify existing job ID is preserved
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('existing-job');
  });

  it('should schedule job if not already scheduled', () => {
    // No existing job
    energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob = null;

    energyMonitoring.init();

    // Verify job is scheduled
    assert.calledOnce(mockScheduler.scheduleJob);

    const jobCall = mockScheduler.scheduleJob.getCall(0);
    expect(jobCall.args[0]).to.equal('0 0,30 * * * *');

    // Verify job ID is set
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('mock-job-id');
  });

  describe('Scheduled job execution', () => {
    let calculateCostEveryThirtyMinutes;
    let calculateConsumptionFromIndex;

    beforeEach(() => {
      calculateCostEveryThirtyMinutes = fake.returns(null);
      calculateConsumptionFromIndex = fake.returns(null);

      energyMonitoring.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
      energyMonitoring.calculateConsumptionFromIndexWithJobWrapper = calculateConsumptionFromIndex;
    });

    it('should execute both consumption and cost calculation when job runs', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job
      await jobFunction();

      // Verify both calculations were called
      assert.calledOnce(calculateConsumptionFromIndex);
      assert.calledOnce(calculateCostEveryThirtyMinutes);
    });

    it('should execute consumption calculation with correct timestamp when job runs', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job (it will use current time)
      await jobFunction();

      // Verify both calculations were called
      assert.calledOnce(calculateConsumptionFromIndex);
      assert.calledOnce(calculateCostEveryThirtyMinutes);

      const callArgs = calculateConsumptionFromIndex.getCall(0).args;
      expect(callArgs[0]).to.be.instanceOf(Date); // thirtyMinutesWindowTime

      // Verify timestamp has correct minutes (should be 0 or 30)
      const minutes = callArgs[0].getMinutes();
      expect([0, 30]).to.include(minutes);

      // Verify seconds and milliseconds are 0
      expect(callArgs[0].getSeconds()).to.equal(0);
      expect(callArgs[0].getMilliseconds()).to.equal(0);
    });

    it('should create timestamp with proper rounding logic', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job to test rounding
      await jobFunction();

      // Verify consumption calculation was called
      assert.calledOnce(calculateConsumptionFromIndex);

      const callArgs = calculateConsumptionFromIndex.getCall(0).args;
      expect(callArgs[0]).to.be.instanceOf(Date); // thirtyMinutesWindowTime

      // Verify the timestamp is properly rounded
      const timestamp = callArgs[0];
      const minutes = timestamp.getMinutes();
      const seconds = timestamp.getSeconds();
      const milliseconds = timestamp.getMilliseconds();

      // Minutes should be 0 or 30
      expect([0, 30]).to.include(minutes);
      // Seconds and milliseconds should be 0 (exact time)
      expect(seconds).to.equal(0);
      expect(milliseconds).to.equal(0);
    });

    it('should round to 00:00 when current time is before 30 minutes', async () => {
      // Use sinon fake timers to mock a time with minutes < 30 (e.g., 10:15:45.123)
      const clock = useFakeTimers(new Date('2023-10-15T10:15:45.123Z'));

      try {
        energyMonitoring.init();

        // Get the combined job function
        const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

        // Execute the job
        await jobFunction();

        // Verify consumption calculation was called with rounded time
        assert.calledOnce(calculateConsumptionFromIndex);

        const callArgs = calculateConsumptionFromIndex.getCall(0).args;
        const timestamp = callArgs[0];

        // Should round to 00:00
        expect(timestamp.getMinutes()).to.equal(0);
        expect(timestamp.getSeconds()).to.equal(0);
        expect(timestamp.getMilliseconds()).to.equal(0);
      } finally {
        clock.restore();
      }
    });

    it('should round to 00:30 when current time is at or after 30 minutes', async () => {
      // Use sinon fake timers to mock a time with minutes >= 30 (e.g., 10:45:30.456)
      const clock = useFakeTimers(new Date('2023-10-15T10:45:30.456Z'));

      try {
        energyMonitoring.init();

        // Get the combined job function
        const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

        // Execute the job
        await jobFunction();

        // Verify consumption calculation was called with rounded time
        assert.calledOnce(calculateConsumptionFromIndex);

        const callArgs = calculateConsumptionFromIndex.getCall(0).args;
        const timestamp = callArgs[0];

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
