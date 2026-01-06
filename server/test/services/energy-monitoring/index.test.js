const { fake, assert } = require('sinon');
const { expect } = require('chai');

const EnergyMonitoringService = require('../../../services/energy-monitoring');

describe('EnergyMonitoring Service', () => {
  let gladys;
  let energyMonitoringService;
  let mockScheduler;

  beforeEach(() => {
    // Mock scheduler
    mockScheduler = {
      scheduleJob: fake.returns('mock-job-id'),
    };

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
        wrapperDetached: (name, func) => func,
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
});
