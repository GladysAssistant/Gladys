/* eslint-disable require-jsdoc */
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { LRUCache } = require('lru-cache');

describe('French calendar - buildPublicHolidaysSet', () => {
  let buildPublicHolidaysSet;
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

    buildPublicHolidaysSet = proxyquire('../../../lib/french-calendar/french-calendar.buildPublicHolidaysSet', {
      axios: { get: axiosGetStub },
      '../../utils/logger': loggerStub,
      'lru-cache': { LRUCache: LRUCacheWrapper },
    }).buildPublicHolidaysSet;
  });

  afterEach(() => {
    if (cacheInstance) {
      cacheInstance.clear();
    }
  });

  it('should fetch public holidays for each year in range', async () => {
    axiosGetStub.callsFake((url) => {
      if (url.includes('/2025.json')) {
        return Promise.resolve({ data: { '2025-01-01': "Jour de l'an", '2025-05-01': 'Fête du travail' } });
      }
      return Promise.resolve({ data: {} });
    });

    const result = await buildPublicHolidaysSet('2025-01-01', '2025-12-31');

    expect(result).to.be.instanceOf(Set);
    expect(result.has('2025-01-01')).to.equal(true);
    expect(result.has('2025-05-01')).to.equal(true);
    expect(axiosGetStub.calledOnce).to.equal(true);
  });

  it('should fetch holidays for multiple years', async () => {
    axiosGetStub.callsFake((url) => {
      if (url.includes('/2024.json')) {
        return Promise.resolve({ data: { '2024-12-25': 'Noël' } });
      }
      if (url.includes('/2025.json')) {
        return Promise.resolve({ data: { '2025-01-01': "Jour de l'an" } });
      }
      return Promise.resolve({ data: {} });
    });

    const result = await buildPublicHolidaysSet('2024-12-01', '2025-01-31');

    expect(result.has('2024-12-25')).to.equal(true);
    expect(result.has('2025-01-01')).to.equal(true);
    expect(axiosGetStub.callCount).to.equal(2);
  });

  it('should use cache on second call for same year', async () => {
    axiosGetStub.resolves({ data: { '2025-07-14': 'Fête nationale' } });

    await buildPublicHolidaysSet('2025-01-01', '2025-12-31');
    axiosGetStub.resetHistory();
    const result = await buildPublicHolidaysSet('2025-06-01', '2025-12-31');

    expect(axiosGetStub.called).to.equal(false);
    expect(result.has('2025-07-14')).to.equal(true);
  });

  it('should return empty set and log warning when API fails', async () => {
    axiosGetStub.rejects(new Error('Network error'));

    const result = await buildPublicHolidaysSet('2025-01-01', '2025-12-31');

    expect(result).to.be.instanceOf(Set);
    expect(result.size).to.equal(0);
    expect(loggerStub.warn.calledOnce).to.equal(true);
  });
});
