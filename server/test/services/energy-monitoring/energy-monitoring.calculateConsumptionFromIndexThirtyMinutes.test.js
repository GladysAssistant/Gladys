const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const EventEmitter = require('events');

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const {
  buildConsumptionThirtyMinutesJobData,
} = require('../../../services/energy-monitoring/lib/energy-monitoring.calculateConsumptionFromIndexThirtyMinutes');

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

describe('EnergyMonitoring.calculateConsumptionFromIndexThirtyMinutes', () => {
  let stateManager;
  let serviceManager;
  let device;
  let gladys;
  let energyMonitoring;
  let calculateConsumptionFromIndex;

  beforeEach(async () => {
    stateManager = new StateManager(event);
    serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, variable, job, brain);

    gladys = {
      variable,
      device,
      job: {
        updateProgress: fake.returns(null),
        wrapper: (name, func) => func,
        wrapperDetached: (name, func) => func,
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    // Mock the calculateConsumptionFromIndex function
    calculateConsumptionFromIndex = fake.resolves(null);
    energyMonitoring.calculateConsumptionFromIndex = calculateConsumptionFromIndex;
  });

  it('should round time to 00:00 when current time is before 30 minutes', async () => {
    const now = new Date('2023-10-15T10:15:45.123Z');
    const jobId = 'test-job-id';

    // The queueWrapper promise resolves when the task completes
    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should round to 00:00
    expect(roundedTime.getMinutes()).to.equal(0);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);

    // Verify jobId was passed
    expect(callArgs[2]).to.equal(jobId);
  });

  it('should round time to 00:30 when current time is at or after 30 minutes', async () => {
    const now = new Date('2023-10-15T10:45:30.456Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should round to 00:30
    expect(roundedTime.getMinutes()).to.equal(30);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);

    // Verify jobId was passed
    expect(callArgs[2]).to.equal(jobId);
  });

  it('should round time to 00:00 when current time is exactly at 00:00', async () => {
    const now = new Date('2023-10-15T10:00:00.000Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should stay at 00:00
    expect(roundedTime.getMinutes()).to.equal(0);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);
  });

  it('should round time to 00:30 when current time is exactly at 00:30', async () => {
    const now = new Date('2023-10-15T10:30:00.000Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should stay at 00:30
    expect(roundedTime.getMinutes()).to.equal(30);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);
  });

  it('should round time to 00:00 when current time is at 29 minutes', async () => {
    const now = new Date('2023-10-15T10:29:59.999Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should round to 00:00
    expect(roundedTime.getMinutes()).to.equal(0);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);
  });

  it('should preserve the hour and date when rounding', async () => {
    // Use a date without timezone to avoid UTC conversion issues
    const now = new Date(2023, 9, 15, 14, 45, 30, 456); // Oct 15, 2023, 14:45:30.456 local time
    const jobId = 'test-job-id';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify calculateConsumptionFromIndex was called
    assert.calledOnce(calculateConsumptionFromIndex);

    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should preserve year, month, day, hour
    expect(roundedTime.getFullYear()).to.equal(2023);
    expect(roundedTime.getMonth()).to.equal(9); // October (0-indexed)
    expect(roundedTime.getDate()).to.equal(15);
    expect(roundedTime.getHours()).to.equal(14);
    expect(roundedTime.getMinutes()).to.equal(30);
  });

  it('should use queue wrapper to prevent concurrent executions', async () => {
    const now = new Date('2023-10-15T10:15:00.000Z');
    const jobId = 'test-job-id';

    // Call the function twice quickly
    const promise1 = energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);
    const promise2 = energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    await Promise.all([promise1, promise2]);

    // Both should have been queued and executed sequentially
    assert.calledTwice(calculateConsumptionFromIndex);
  });

  it('should handle errors from calculateConsumptionFromIndex', async () => {
    const now = new Date('2023-10-15T10:15:00.000Z');
    const jobId = 'test-job-id';
    const error = new Error('Test error');

    // Make calculateConsumptionFromIndex reject
    energyMonitoring.calculateConsumptionFromIndex = fake.rejects(error);

    // Should reject with the error
    await expect(energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId)).to.be.rejectedWith(
      'Test error',
    );
  });

  it('should pass jobId to calculateConsumptionFromIndex', async () => {
    const now = new Date('2023-10-15T10:15:00.000Z');
    const jobId = 'specific-job-id-12345';

    await energyMonitoring.calculateConsumptionFromIndexThirtyMinutes(now, jobId);

    // Verify jobId was passed correctly
    assert.calledOnce(calculateConsumptionFromIndex);
    const callArgs = calculateConsumptionFromIndex.getCall(0).args;
    expect(callArgs[2]).to.equal('specific-job-id-12345');
  });

  it('should build job data for thirty-minute consumption window', () => {
    const now = new Date('2025-02-01T10:42:00.000Z');
    const data = buildConsumptionThirtyMinutesJobData(now);
    expect(data.scope).to.equal('all');
    expect(data.period.start_date).to.be.a('string');
    expect(data.period.end_date).to.be.a('string');
    // end date is the rounded window end (00 or 30).
    const end = new Date(data.period.end_date);
    const start = new Date(data.period.start_date);
    expect(end.getTime() - start.getTime()).to.equal(30 * 60 * 1000);
    expect(end.getUTCMinutes() === 0 || end.getUTCMinutes() === 30).to.equal(true);
  });
});
