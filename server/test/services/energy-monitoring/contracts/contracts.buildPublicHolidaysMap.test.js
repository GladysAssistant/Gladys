/* eslint-disable require-jsdoc */
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { ENERGY_CONTRACT_TYPES } = require('../../../../utils/constants');

describe('Contracts.buildPublicHolidaysMap', () => {
  let buildPublicHolidaysMap;
  let needsPublicHolidays;
  let buildPublicHolidaysSetStub;
  let loggerStub;

  beforeEach(() => {
    buildPublicHolidaysSetStub = sinon.stub();
    loggerStub = {
      info: sinon.stub(),
    };

    ({ buildPublicHolidaysMap, needsPublicHolidays } = proxyquire(
      '../../../../services/energy-monitoring/contracts/contracts.buildPublicHolidaysMap',
      {
        '../../../lib/french-calendar': {
          buildPublicHolidaysSet: buildPublicHolidaysSetStub,
        },
        '../../../utils/logger': loggerStub,
      },
    ));
  });

  it('should build public holidays set from start date to today', async () => {
    const holidaysSet = new Set(['2025-05-01', '2025-07-14']);
    buildPublicHolidaysSetStub.resolves(holidaysSet);

    const result = await buildPublicHolidaysMap('2025-01-01');

    expect(buildPublicHolidaysSetStub.calledOnce).to.equal(true);
    expect(result).to.equal(holidaysSet);
    expect(loggerStub.info.callCount).to.equal(2);
    expect(loggerStub.info.firstCall.args[0]).to.include('Building French public holidays set');
    expect(loggerStub.info.secondCall.args[0]).to.include('Found 2 French public holidays');
  });

  describe('needsPublicHolidays', () => {
    it('should return true for Enercoop Nuit & Week-end contract', () => {
      const result = needsPublicHolidays([{ contract: ENERGY_CONTRACT_TYPES.ENERCOOP_NUIT_WEEKEND }]);
      expect(result).to.equal(true);
    });

    it('should return true for Enercoop 2 Saisons contract', () => {
      const result = needsPublicHolidays([{ contract: ENERGY_CONTRACT_TYPES.ENERCOOP_2_SAISONS }]);
      expect(result).to.equal(true);
    });

    it('should return false for other contract types', () => {
      const result = needsPublicHolidays([
        { contract: ENERGY_CONTRACT_TYPES.BASE },
        { contract: ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK },
      ]);
      expect(result).to.equal(false);
    });
  });
});
