/* eslint-disable require-jsdoc */
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { LRUCache } = require('lru-cache');

describe('French calendar - buildSchoolVacationsSet', () => {
  let buildSchoolVacationsSet;
  let axiosGetStub;
  let loggerStub;
  let cacheInstance;

  beforeEach(() => {
    axiosGetStub = sinon.stub();
    loggerStub = {
      warn: sinon.stub(),
    };

    function LRUCacheWrapper(options) {
      const instance = new LRUCache(options);
      cacheInstance = instance;
      return instance;
    }

    ({ buildSchoolVacationsSet } = proxyquire('../../../lib/french-calendar/french-calendar.buildSchoolVacationsSet', {
      axios: { get: axiosGetStub },
      '../../utils/logger': loggerStub,
      'lru-cache': { LRUCache: LRUCacheWrapper },
    }));
  });

  afterEach(() => {
    if (cacheInstance) {
      cacheInstance.clear();
    }
  });

  it('should return empty set for invalid zone', async () => {
    const result = await buildSchoolVacationsSet('2025-01-01', '2025-12-31', 'Invalid Zone');

    expect(result).to.be.instanceOf(Set);
    expect(result.size).to.equal(0);
    expect(axiosGetStub.called).to.equal(false);
  });

  it('should return empty set when zone is not provided', async () => {
    const result = await buildSchoolVacationsSet('2025-01-01', '2025-12-31', null);

    expect(result.size).to.equal(0);
    expect(axiosGetStub.called).to.equal(false);
  });

  it('should fetch school vacation dates for a valid zone', async () => {
    axiosGetStub.resolves({
      data: {
        results: [
          {
            start_date: '2025-02-21T23:00:00+00:00',
            end_date: '2025-03-08T23:00:00+00:00',
          },
        ],
      },
    });

    const result = await buildSchoolVacationsSet('2025-01-01', '2025-12-31', 'Zone A');

    expect(axiosGetStub.calledOnce).to.equal(true);
    expect(result.size).to.be.greaterThan(0);
    expect(result.has('2025-02-22')).to.equal(true);
  });

  it('should use cache on second call with same parameters', async () => {
    axiosGetStub.resolves({
      data: {
        results: [
          {
            start_date: '2025-04-18T22:00:00+00:00',
            end_date: '2025-05-04T22:00:00+00:00',
          },
        ],
      },
    });

    await buildSchoolVacationsSet('2025-01-01', '2025-12-31', 'Zone B');
    axiosGetStub.resetHistory();
    const result = await buildSchoolVacationsSet('2025-01-01', '2025-12-31', 'Zone B');

    expect(axiosGetStub.called).to.equal(false);
    expect(result.size).to.be.greaterThan(0);
  });

  it('should return empty set and log warning when API fails', async () => {
    axiosGetStub.rejects(new Error('API unavailable'));

    const result = await buildSchoolVacationsSet('2025-01-01', '2025-12-31', 'Zone C');

    expect(result.size).to.equal(0);
    expect(loggerStub.warn.calledOnce).to.equal(true);
  });
});
