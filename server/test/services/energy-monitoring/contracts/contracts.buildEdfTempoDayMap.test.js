/* eslint-disable require-jsdoc */
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const dayjs = require('dayjs');
const { LRUCache } = require('lru-cache');

describe('Contracts.buildEdfTempoDayMap', () => {
  let buildEdfTempoDayMap;
  let loggerStub;
  let gladys;
  let cacheInstance;

  beforeEach(() => {
    // Create logger stub
    loggerStub = {
      info: sinon.stub(),
    };

    /**
     * @description Capture LRUCache instance for assertions.
     * @param {object} options - LRU cache options.
     * @returns {LRUCache} Wrapped cache instance.
     * @example
     * new LRUCacheWrapper({ max: 1 });
     */
    function LRUCacheWrapper(options) {
      // When called with 'new', create real LRUCache and capture it
      const instance = new LRUCache(options);
      cacheInstance = instance;
      // Return the instance so 'new LRUCacheWrapper()' returns it
      return instance;
    }

    // Load the module with stubbed logger and cache
    buildEdfTempoDayMap = proxyquire('../../../../services/energy-monitoring/contracts/contracts.buildEdfTempoDayMap', {
      '../../../utils/logger': loggerStub,
      'lru-cache': { LRUCache: LRUCacheWrapper },
    }).buildEdfTempoDayMap;

    // Create gladys mock
    gladys = {
      gateway: {
        getEdfTempoHistorical: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    // Clear cache after each test
    if (cacheInstance) {
      cacheInstance.clear();
    }
  });

  it('should build map with multiple EDF tempo historical days', async () => {
    const startDate = '2023-01-01';
    const mockHistoricalData = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-02', day_type: 'WHITE' },
      { created_at: '2023-01-03', day_type: 'RED' },
      { created_at: '2023-01-04', day_type: 'BLUE' },
    ];

    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify the gateway was called with correct parameters
    expect(gladys.gateway.getEdfTempoHistorical.calledOnce).to.equal(true);
    expect(gladys.gateway.getEdfTempoHistorical.firstCall.args[0]).to.equal(startDate);
    expect(gladys.gateway.getEdfTempoHistorical.firstCall.args[1]).to.equal(1000000);

    // Verify the map was built correctly
    expect(result).to.be.instanceOf(Map);
    expect(result.size).to.equal(4);
    expect(result.get('2023-01-01')).to.equal('BLUE');
    expect(result.get('2023-01-02')).to.equal('WHITE');
    expect(result.get('2023-01-03')).to.equal('RED');
    expect(result.get('2023-01-04')).to.equal('BLUE');

    // Verify logging (3 calls: initial, fetching missing, found results)
    expect(loggerStub.info.callCount).to.be.at.least(2);
    expect(loggerStub.info.firstCall.args[0]).to.equal('Building EDF tempo historical map from 2023-01-01');
    // Check that one of the log calls mentions fetching or results
    const logMessages = loggerStub.info.getCalls().map((call) => call.args[0]);
    expect(logMessages.some((msg) => msg.includes('EDF tempo'))).to.equal(true);
  });

  it('should build empty map when no historical data is returned', async () => {
    const startDate = '2023-01-01';
    gladys.gateway.getEdfTempoHistorical.resolves([]);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify the map is empty
    expect(result).to.be.instanceOf(Map);
    expect(result.size).to.equal(0);

    // Verify logging
    expect(loggerStub.info.callCount).to.be.at.least(2);
    expect(loggerStub.info.firstCall.args[0]).to.equal('Building EDF tempo historical map from 2023-01-01');
    const logMessages = loggerStub.info.getCalls().map((call) => call.args[0]);
    expect(logMessages.some((msg) => msg.includes('No EDF tempo historical days returned'))).to.equal(true);
  });

  it('should build map with single day', async () => {
    const startDate = '2023-06-15';
    const mockHistoricalData = [{ created_at: '2023-06-15', day_type: 'WHITE' }];

    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify the map
    expect(result).to.be.instanceOf(Map);
    expect(result.size).to.equal(1);
    expect(result.get('2023-06-15')).to.equal('WHITE');

    // Verify logging
    expect(loggerStub.info.callCount).to.be.at.least(2);
    const logMessages = loggerStub.info.getCalls().map((call) => call.args[0]);
    expect(logMessages.some((msg) => msg.includes('EDF tempo'))).to.equal(true);
  });

  it('should handle duplicate dates by keeping the last value', async () => {
    const startDate = '2023-01-01';
    const mockHistoricalData = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-01', day_type: 'RED' }, // Duplicate date
      { created_at: '2023-01-02', day_type: 'WHITE' },
    ];

    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify the map (duplicate should be overwritten)
    expect(result).to.be.instanceOf(Map);
    expect(result.size).to.equal(2); // Only 2 unique dates
    expect(result.get('2023-01-01')).to.equal('RED'); // Last value wins
    expect(result.get('2023-01-02')).to.equal('WHITE');
  });

  it('should propagate errors from gateway', async () => {
    const startDate = '2023-01-01';
    const error = new Error('Gateway connection failed');
    gladys.gateway.getEdfTempoHistorical.rejects(error);

    try {
      await buildEdfTempoDayMap(gladys, startDate);
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).to.equal('Gateway connection failed');
    }

    // Verify initial log was called
    expect(loggerStub.info.callCount).to.be.at.least(1);
    expect(loggerStub.info.firstCall.args[0]).to.equal('Building EDF tempo historical map from 2023-01-01');
  });

  it('should handle all tempo day types correctly', async () => {
    const startDate = '2023-01-01';
    const mockHistoricalData = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-02', day_type: 'WHITE' },
      { created_at: '2023-01-03', day_type: 'RED' },
    ];

    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify all day types are stored correctly
    expect(result.get('2023-01-01')).to.equal('BLUE');
    expect(result.get('2023-01-02')).to.equal('WHITE');
    expect(result.get('2023-01-03')).to.equal('RED');
  });

  it('should use cache and skip API call when all days are cached', async () => {
    const startDate = '2023-01-01';
    const today = dayjs().format('YYYY-MM-DD');
    const mockHistoricalData = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-02', day_type: 'WHITE' },
    ];

    // First call - should hit API
    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData);
    const result1 = await buildEdfTempoDayMap(gladys, startDate);

    expect(gladys.gateway.getEdfTempoHistorical.calledOnce).to.equal(true);
    expect(result1.get('2023-01-01')).to.equal('BLUE');
    expect(result1.get('2023-01-02')).to.equal('WHITE');

    // Reset stub for second call
    gladys.gateway.getEdfTempoHistorical.reset();
    gladys.gateway.getEdfTempoHistorical.resolves([]);

    // Second call with same date range - should use cache if dates are in past
    if (dayjs(startDate).isBefore(dayjs(today).subtract(2, 'day'))) {
      const result2 = await buildEdfTempoDayMap(gladys, startDate);

      // Should have used cache (no API call or API called but cache used for some days)
      expect(result2.get('2023-01-01')).to.equal('BLUE');
      expect(result2.get('2023-01-02')).to.equal('WHITE');
    }
  });

  it('should fetch missing days from API and use cache for existing days', async () => {
    const startDate = '2023-01-01';
    const mockHistoricalData1 = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-02', day_type: 'WHITE' },
    ];

    // First call - populate cache with some days
    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData1);
    await buildEdfTempoDayMap(gladys, startDate);

    // Reset and prepare for second call with extended date range
    gladys.gateway.getEdfTempoHistorical.reset();
    const mockHistoricalData2 = [
      { created_at: '2023-01-01', day_type: 'BLUE' },
      { created_at: '2023-01-02', day_type: 'WHITE' },
      { created_at: '2023-01-03', day_type: 'RED' },
    ];
    gladys.gateway.getEdfTempoHistorical.resolves(mockHistoricalData2);

    // Second call - should use cache for 01-01 and 01-02, fetch 01-03
    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify all days are in result
    expect(result.get('2023-01-01')).to.equal('BLUE');
    expect(result.get('2023-01-02')).to.equal('WHITE');
    expect(result.get('2023-01-03')).to.equal('RED');
  });
});
