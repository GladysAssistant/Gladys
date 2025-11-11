const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Contracts.buildEdfTempoDayMap', () => {
  let buildEdfTempoDayMap;
  let loggerStub;
  let gladys;

  beforeEach(() => {
    // Create logger stub
    loggerStub = {
      info: sinon.stub(),
    };

    // Load the module with stubbed logger
    buildEdfTempoDayMap = proxyquire('../../../../services/energy-monitoring/contracts/contracts.buildEdfTempoDayMap', {
      '../../../utils/logger': loggerStub,
    }).buildEdfTempoDayMap;

    // Create gladys mock
    gladys = {
      gateway: {
        getEdfTempoHistorical: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
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

    // Verify logging
    expect(loggerStub.info.calledTwice).to.equal(true);
    expect(loggerStub.info.firstCall.args[0]).to.equal('Building EDF tempo historical map from 2023-01-01');
    expect(loggerStub.info.secondCall.args[0]).to.include('Found 4 EDF tempo historical days');
    expect(loggerStub.info.secondCall.args[0]).to.include('Most recent date: 2023-01-04');
  });

  it('should build empty map when no historical data is returned', async () => {
    const startDate = '2023-01-01';
    gladys.gateway.getEdfTempoHistorical.resolves([]);

    const result = await buildEdfTempoDayMap(gladys, startDate);

    // Verify the map is empty
    expect(result).to.be.instanceOf(Map);
    expect(result.size).to.equal(0);

    // Verify logging
    expect(loggerStub.info.calledTwice).to.equal(true);
    expect(loggerStub.info.firstCall.args[0]).to.equal('Building EDF tempo historical map from 2023-01-01');
    expect(loggerStub.info.secondCall.args[0]).to.equal('No EDF tempo historical days returned');
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
    expect(loggerStub.info.calledTwice).to.equal(true);
    expect(loggerStub.info.secondCall.args[0]).to.include('Found 1 EDF tempo historical days');
    expect(loggerStub.info.secondCall.args[0]).to.include('Most recent date: 2023-06-15');
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
    expect(loggerStub.info.calledOnce).to.equal(true);
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
});
