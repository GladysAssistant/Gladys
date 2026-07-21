const { fake, assert } = require('sinon');
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

describe('EnergyMonitoring.calculateProductionFromIndexThirtyMinutes', () => {
  let stateManager;
  let serviceManager;
  let device;
  let gladys;
  let energyMonitoring;
  let calculateProductionFromIndex;

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
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    // Mock the calculateProductionFromIndex function
    calculateProductionFromIndex = fake.resolves(null);
    energyMonitoring.calculateProductionFromIndex = calculateProductionFromIndex;
  });

  it('should round time to 00:00 when current time is before 30 minutes', async () => {
    const now = new Date('2023-10-15T10:15:45.123Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateProductionFromIndexThirtyMinutes(now, jobId);

    assert.calledOnce(calculateProductionFromIndex);

    const callArgs = calculateProductionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should round to 00:00
    expect(roundedTime.getMinutes()).to.equal(0);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);

    // Verify jobId was passed
    expect(callArgs[1]).to.equal(jobId);
  });

  it('should round time to 00:30 when current time is at or after 30 minutes', async () => {
    const now = new Date('2023-10-15T10:45:30.456Z');
    const jobId = 'test-job-id';

    await energyMonitoring.calculateProductionFromIndexThirtyMinutes(now, jobId);

    assert.calledOnce(calculateProductionFromIndex);

    const callArgs = calculateProductionFromIndex.getCall(0).args;
    const roundedTime = callArgs[0];

    // Should round to 00:30
    expect(roundedTime.getMinutes()).to.equal(30);
    expect(roundedTime.getSeconds()).to.equal(0);
    expect(roundedTime.getMilliseconds()).to.equal(0);

    // Verify jobId was passed
    expect(callArgs[1]).to.equal(jobId);
  });

  it('should preserve the hour and date when rounding', async () => {
    // Use a date without timezone to avoid UTC conversion issues
    const now = new Date(2023, 9, 15, 14, 45, 30, 456); // Oct 15, 2023, 14:45:30.456 local time

    await energyMonitoring.calculateProductionFromIndexThirtyMinutes(now, 'job-id');

    assert.calledOnce(calculateProductionFromIndex);
    const roundedTime = calculateProductionFromIndex.getCall(0).args[0];

    // Should preserve year, month, day, hour
    expect(roundedTime.getFullYear()).to.equal(2023);
    expect(roundedTime.getMonth()).to.equal(9); // October (0-indexed)
    expect(roundedTime.getDate()).to.equal(15);
    expect(roundedTime.getHours()).to.equal(14);
    expect(roundedTime.getMinutes()).to.equal(30);
  });

  it('should not mutate the date passed as argument', async () => {
    const now = new Date('2023-10-15T10:15:45.123Z');
    const originalTime = now.getTime();

    await energyMonitoring.calculateProductionFromIndexThirtyMinutes(now, 'job-id');

    expect(now.getTime()).to.equal(originalTime);
  });

  it('should propagate errors from calculateProductionFromIndex', async () => {
    const now = new Date('2023-10-15T10:15:45.123Z');
    energyMonitoring.calculateProductionFromIndex = fake.rejects(new Error('Processing error'));

    let thrownError = null;
    try {
      await energyMonitoring.calculateProductionFromIndexThirtyMinutes(now, 'job-id');
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).to.not.equal(null);
    expect(thrownError.message).to.equal('Processing error');
  });
});
