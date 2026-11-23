const { expect } = require('chai');
const { isEnergyCursorParam } = require('../../../../services/energy-monitoring/utils/constants');

describe('energy-monitoring.constants.isEnergyCursorParam', () => {
  it('should match the legacy and per-index cursors of both kinds', () => {
    expect(isEnergyCursorParam('ENERGY_INDEX_LAST_PROCESSED')).to.equal(true);
    expect(isEnergyCursorParam('ENERGY_INDEX_LAST_PROCESSED_1d9e7a4c')).to.equal(true);
    expect(isEnergyCursorParam('ENERGY_PRODUCTION_INDEX_LAST_PROCESSED')).to.equal(true);
    expect(isEnergyCursorParam('ENERGY_PRODUCTION_INDEX_LAST_PROCESSED_1d9e7a4c')).to.equal(true);
  });
  it('should not match other params', () => {
    expect(isEnergyCursorParam('IP_ADDRESS')).to.equal(false);
    expect(isEnergyCursorParam('ENERGY_INDEX_LAST_PROCESSEDX')).to.equal(false);
    expect(isEnergyCursorParam(undefined)).to.equal(false);
  });
});
