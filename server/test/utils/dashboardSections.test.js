const { expect } = require('chai');

const { normalizeDashboardBoxes } = require('../../utils/dashboardSections');

describe('normalizeDashboardBoxes', () => {
  it('should wrap legacy column-based boxes into a single section', () => {
    const legacyBoxes = [[{ type: 'weather' }], [{ type: 'clock' }]];
    expect(normalizeDashboardBoxes(legacyBoxes)).to.deep.equal([
      { columns: [[{ type: 'weather' }], [{ type: 'clock' }]] },
    ]);
  });
  it('should keep section-based boxes untouched', () => {
    const sectionBoxes = [{ columns: [[{ type: 'weather' }]] }, { columns: [[], []] }];
    expect(normalizeDashboardBoxes(sectionBoxes)).to.equal(sectionBoxes);
  });
  it('should keep an empty array untouched', () => {
    const emptyBoxes = [];
    expect(normalizeDashboardBoxes(emptyBoxes)).to.equal(emptyBoxes);
  });
  it('should keep a non-array value untouched', () => {
    expect(normalizeDashboardBoxes('invalid')).to.equal('invalid');
    expect(normalizeDashboardBoxes(undefined)).to.equal(undefined);
  });
});
