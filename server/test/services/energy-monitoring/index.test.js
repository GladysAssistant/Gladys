const { fake, assert } = require('sinon');
const { expect } = require('chai');
const { JOB_TYPES } = require('../../../utils/constants');

const EnergyMonitoringService = require('../../../services/energy-monitoring');

describe('EnergyMonitoring Service', () => {
  let gladys;
  let energyMonitoringService;
  let mockScheduler;
  let wrapperDetachedSpy;

  beforeEach(() => {
    // Mock scheduler
    mockScheduler = {
      scheduleJob: fake.returns('mock-job-id'),
    };
    wrapperDetachedSpy = fake((name, func) => func);

    gladys = {
      variable: {
        getValue: fake.resolves('Europe/Paris'),
      },
      device: {
        get: fake.resolves([]),
      },
      scheduler: mockScheduler,
      job: {
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
        wrapperDetached: wrapperDetachedSpy,
      },
    };

    energyMonitoringService = EnergyMonitoringService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });

  it('should start the energy monitoring service and initialize handler', async () => {
    await energyMonitoringService.start();

    // Verify scheduler was called to schedule both jobs (30 min + 24h)
    assert.calledTwice(mockScheduler.scheduleJob);

    // Verify that 30-minute job is scheduled
    const thirtyMinJobCall = mockScheduler.scheduleJob.getCall(0);
    expect(thirtyMinJobCall.args[0]).to.equal('0 0,30 * * * *');

    // Verify that 24h job is scheduled with RecurrenceRule
    const dailyJobCall = mockScheduler.scheduleJob.getCall(1);
    const rule = dailyJobCall.args[0];
    expect(rule).to.have.property('hour', 11);
    expect(rule).to.have.property('minute', 10);
    expect(rule).to.have.property('tz', 'Europe/Paris');
  });

  it('should not throw error when starting service', async () => {
    let error;
    try {
      await energyMonitoringService.start();
    } catch (e) {
      error = e;
    }

    expect(error).to.equal(undefined);
  });

  it('should stop the energy monitoring service', async () => {
    let error;
    try {
      await energyMonitoringService.stop();
    } catch (e) {
      error = e;
    }

    expect(error).to.equal(undefined);
  });

  it('should be callable multiple times without error', async () => {
    await energyMonitoringService.stop();
    await energyMonitoringService.stop();

    // Should not throw
    expect(true).to.equal(true);
  });

  it('should wrap detached range jobs once with buildJobData', async () => {
    const detachedCalls = wrapperDetachedSpy.getCalls();
    const costRangeCalls = detachedCalls.filter(
      (call) => call.args[0] === JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_RANGE,
    );
    const consumptionRangeCalls = detachedCalls.filter(
      (call) => call.args[0] === JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_RANGE,
    );

    expect(costRangeCalls).to.have.lengthOf(1);
    expect(consumptionRangeCalls).to.have.lengthOf(1);
    expect(costRangeCalls[0].args[2]).to.have.property('buildJobData');
    expect(typeof costRangeCalls[0].args[2].buildJobData).to.equal('function');
    expect(consumptionRangeCalls[0].args[2]).to.have.property('buildJobData');
    expect(typeof consumptionRangeCalls[0].args[2].buildJobData).to.equal('function');
  });
});
