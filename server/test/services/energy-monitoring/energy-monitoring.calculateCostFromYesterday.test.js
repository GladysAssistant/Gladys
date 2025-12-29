const { expect } = require('chai');
const sinon = require('sinon');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const Event = require('../../../lib/event');
const Job = require('../../../lib/job');
const Device = require('../../../lib/device');
const Variable = require('../../../lib/variable');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const {
  buildCostYesterdayJobData,
} = require('../../../services/energy-monitoring/lib/energy-monitoring.calculateCostFromYesterday');

const EnergyMonitoring = require('../../../services/energy-monitoring/lib');

describe('EnergyMonitoring.calculateCostFromYesterday', () => {
  let energyMonitoring;
  let calculateCostFrom;
  let gladys;
  let job;

  beforeEach(() => {
    const event = new Event();
    job = new Job(event);
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager(event, stateManager, {}, {});
    const device = new Device(
      event,
      {},
      stateManager,
      serviceManager,
      {},
      new Variable(event, {}, stateManager, serviceManager),
      job,
      {},
    );

    gladys = {
      device,
      job: {
        wrapper: (name, func) => func,
        wrapperDetached: (name, func) => func,
        updateProgress: sinon.fake.resolves(null),
      },
    };

    energyMonitoring = new EnergyMonitoring(gladys, 'service-id');
    calculateCostFrom = sinon.fake.resolves(null);
    energyMonitoring.calculateCostFrom = calculateCostFrom;
  });

  it('should pass yesterday date and jobId to calculateCostFrom', async () => {
    const yesterday = new Date('2025-01-02T00:00:00.000Z');
    const jobId = 'job-yesterday';

    await energyMonitoring.calculateCostFromYesterday(yesterday, jobId);

    expect(calculateCostFrom.calledOnce).to.equal(true);
    const { args } = calculateCostFrom.getCall(0);
    expect(args[0]).to.equal(yesterday);
    expect(args[2]).to.equal(jobId);
    expect(args[3]).to.equal(null);
  });

  it('should build job data for yesterday cost job', () => {
    const yesterday = new Date('2025-01-02T00:00:00.000Z');
    const data = buildCostYesterdayJobData(yesterday);
    expect(data).to.deep.equal({
      scope: 'all',
      period: {
        start_date: yesterday.toISOString(),
        end_date: null,
      },
      kind: 'cost',
    });
  });
});
