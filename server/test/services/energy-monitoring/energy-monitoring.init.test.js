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
        wrapperDetached: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });

  it('should schedule combined energy monitoring job on first init', async () => {
    await energyMonitoring.init();

    // Verify both jobs are scheduled (30 min job + 24h job)
    assert.calledTwice(mockScheduler.scheduleJob);

    // Verify combined job (at 00:00 and 00:30)
    const jobCall = mockScheduler.scheduleJob.getCall(0);
    expect(jobCall.args[0]).to.equal('0 0,30 * * * *');
    expect(typeof jobCall.args[1]).to.equal('function');

    // Verify 24h job uses RecurrenceRule with timezone
    const dailyJobCall = mockScheduler.scheduleJob.getCall(1);
    const rule = dailyJobCall.args[0];
    expect(rule).to.have.property('recurs', true);
    expect(rule).to.have.property('hour', 11);
    expect(rule).to.have.property('minute', 10);
    expect(rule).to.have.property('tz', 'Europe/Paris');
    expect(typeof dailyJobCall.args[1]).to.equal('function');

    // Verify job IDs are stored
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('mock-job-id');
    expect(energyMonitoring.calculateConsumptionAndCostEvery24HoursJob).to.equal('mock-job-id');
  });

  it('should not schedule job again if already scheduled', async () => {
    // Set existing job IDs
    energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob = 'existing-job';
    energyMonitoring.calculateConsumptionAndCostEvery24HoursJob = 'existing-daily-job';

    await energyMonitoring.init();

    // Verify no new job is scheduled
    assert.notCalled(mockScheduler.scheduleJob);

    // Verify existing job IDs are preserved
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('existing-job');
    expect(energyMonitoring.calculateConsumptionAndCostEvery24HoursJob).to.equal('existing-daily-job');
  });

  it('should schedule job if not already scheduled', async () => {
    // No existing jobs
    energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob = null;
    energyMonitoring.calculateConsumptionAndCostEvery24HoursJob = null;

    await energyMonitoring.init();

    // Verify both jobs are scheduled
    assert.calledTwice(mockScheduler.scheduleJob);

    const jobCall = mockScheduler.scheduleJob.getCall(0);
    expect(jobCall.args[0]).to.equal('0 0,30 * * * *');

    // Verify job IDs are set
    expect(energyMonitoring.calculateConsumptionAndCostEvery30MinutesJob).to.equal('mock-job-id');
    expect(energyMonitoring.calculateConsumptionAndCostEvery24HoursJob).to.equal('mock-job-id');
  });

  describe('Scheduled job execution', () => {
    let calculateCostEveryThirtyMinutes;
    let calculateConsumptionFromIndexThirtyMinutes;
    let calculateCostFromYesterday;

    beforeEach(() => {
      calculateCostEveryThirtyMinutes = fake.returns(null);
      calculateConsumptionFromIndexThirtyMinutes = fake.returns(null);
      calculateCostFromYesterday = fake.returns(null);

      energyMonitoring.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
      energyMonitoring.calculateConsumptionFromIndexThirtyMinutes = calculateConsumptionFromIndexThirtyMinutes;
      energyMonitoring.calculateCostFromYesterday = calculateCostFromYesterday;
    });

    it('should execute both consumption and cost calculation when job runs', async () => {
      await energyMonitoring.init();

      // Get the combined job function
      const jobFunction = mockScheduler.scheduleJob.getCall(0).args[1];

      // Execute the job
      await jobFunction();

      // Verify both calculations were called
      assert.calledOnce(calculateConsumptionFromIndexThirtyMinutes);
      assert.calledOnce(calculateCostEveryThirtyMinutes);
    });

    it('should pass current time to both calculation functions', async () => {
      await energyMonitoring.init();

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
      await energyMonitoring.init();

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
        await energyMonitoring.init();

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
        await energyMonitoring.init();

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

    it('should execute calculateCostFromYesterday with yesterday at midnight when daily job runs', async () => {
      // Use sinon fake timers to mock a specific time
      const clock = useFakeTimers(new Date('2023-10-15T09:00:00.000Z'));

      try {
        await energyMonitoring.init();

        // Get the daily job function (second call)
        const dailyJobFunction = mockScheduler.scheduleJob.getCall(1).args[1];

        // Execute the daily job
        await dailyJobFunction();

        // Verify calculateCostFromYesterday was called
        assert.calledOnce(calculateCostFromYesterday);

        const callArgs = calculateCostFromYesterday.getCall(0).args;
        const yesterdayDate = callArgs[0];

        // Should be yesterday at midnight in Europe/Paris timezone
        expect(yesterdayDate).to.be.instanceOf(Date);
        // October 14, 2023 at midnight in Europe/Paris (CEST = UTC+2)
        // So midnight Paris = 22:00 UTC on Oct 13
        expect(yesterdayDate.getUTCFullYear()).to.equal(2023);
        expect(yesterdayDate.getUTCMonth()).to.equal(9); // October (0-indexed)
        expect(yesterdayDate.getUTCDate()).to.equal(13);
        expect(yesterdayDate.getUTCHours()).to.equal(22); // Midnight Paris = 22:00 UTC (CEST)
        expect(yesterdayDate.getUTCMinutes()).to.equal(0);
        expect(yesterdayDate.getUTCSeconds()).to.equal(0);
      } finally {
        clock.restore();
      }
    });
  });
});
