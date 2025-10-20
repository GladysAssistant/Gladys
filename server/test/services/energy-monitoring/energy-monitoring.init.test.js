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
    let calculateConsumptionFromIndexThirtyMinutes;

    beforeEach(() => {
      calculateCostEveryThirtyMinutes = fake.returns(null);
      calculateConsumptionFromIndexThirtyMinutes = fake.returns(null);

      energyMonitoring.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
      energyMonitoring.calculateConsumptionFromIndexThirtyMinutes = calculateConsumptionFromIndexThirtyMinutes;
    });

    it('should execute both consumption and cost calculation when job runs', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job
      await jobFunction();

      // Verify both calculations were called
      assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);
      assert.calledOnce(calculateCostEveryThirtyMinutes);
    });

    it('should pass current time to both calculation functions', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job (it will use current time)
      await jobFunction();

      // Verify both calculations were called
      assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);
      assert.calledOnce(calculateCostEveryThirtyMinutes);

      // Verify both functions receive the now timestamp
      const consumptionCallArgs = calculateConsumptionFromIndexThirtyMinutes.getCall(0).args;
      const costCallArgs = calculateCostEveryThirtyMinutes.getCall(0).args;

      expect(consumptionCallArgs[0]).to.be.instanceOf(Date);
      expect(costCallArgs[0]).to.be.instanceOf(Date);
    });

    it('should create current timestamp when job executes', async () => {
      energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job
      await jobFunction();

      // Verify consumption calculation was called
      assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);

      const callArgs = calculateConsumptionFromIndexThirtyMinutes.getCall(0).args;
      expect(callArgs[0]).to.be.instanceOf(Date);
    });

    it('should pass mocked time when using fake timers (before 30 minutes)', async () => {
      // Use sinon fake timers to mock a time with minutes < 30 (e.g., 10:15:45.123)
      const clock = useFakeTimers(new Date('2023-10-15T10:15:45.123Z'));

      try {
        energyMonitoring.init();

        // Get the combined job function
        const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

        // Execute the job
        await jobFunction();

        // Verify consumption calculation was called
        assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);

        const callArgs = calculateConsumptionFromIndexThirtyMinutes.getCall(0).args;
        const timestamp = callArgs[0];

        // Should receive the mocked time
        expect(timestamp.getMinutes()).to.equal(15);
        expect(timestamp.getSeconds()).to.equal(45);
        expect(timestamp.getMilliseconds()).to.equal(123);
      } finally {
        clock.restore();
      }
    });

    it('should pass mocked time when using fake timers (after 30 minutes)', async () => {
      // Use sinon fake timers to mock a time with minutes >= 30 (e.g., 10:45:30.456)
      const clock = useFakeTimers(new Date('2023-10-15T10:45:30.456Z'));

      try {
        energyMonitoring.init();

        // Get the combined job function
        const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

        // Execute the job
        await jobFunction();

        // Verify consumption calculation was called
        assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);

        const callArgs = calculateConsumptionFromIndexThirtyMinutes.getCall(0).args;
        const timestamp = callArgs[0];

        // Should receive the mocked time
        expect(timestamp.getMinutes()).to.equal(45);
        expect(timestamp.getSeconds()).to.equal(30);
        expect(timestamp.getMilliseconds()).to.equal(456);
      } finally {
        clock.restore();
      }
    });
  });
});
