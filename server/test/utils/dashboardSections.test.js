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
  it('should keep a section with valid widths untouched', () => {
    const sectionBoxes = [{ columns: [[], []], widths: [2, 1] }];
    expect(normalizeDashboardBoxes(sectionBoxes)).to.equal(sectionBoxes);
  });
  it('should drop widths when every column has the default weight', () => {
    expect(normalizeDashboardBoxes([{ columns: [[], []], widths: [1, 1] }])).to.deep.equal([{ columns: [[], []] }]);
  });
  it('should pad missing widths with the default weight', () => {
    expect(normalizeDashboardBoxes([{ columns: [[], [], []], widths: [2] }])).to.deep.equal([
      { columns: [[], [], []], widths: [2, 1, 1] },
    ]);
  });
  it('should truncate extra widths left by a deleted column', () => {
    expect(normalizeDashboardBoxes([{ columns: [[], []], widths: [2, 1, 2] }])).to.deep.equal([
      { columns: [[], []], widths: [2, 1] },
    ]);
  });
  it('should pad a hole in the middle of widths, which keeps the same length', () => {
    expect(normalizeDashboardBoxes([{ columns: [[], []], widths: [2, null] }])).to.deep.equal([
      { columns: [[], []], widths: [2, 1] },
    ]);
    expect(normalizeDashboardBoxes([{ columns: [[], []], widths: [2, undefined] }])).to.deep.equal([
      { columns: [[], []], widths: [2, 1] },
    ]);
    expect(normalizeDashboardBoxes([{ columns: [[], []], widths: [2, 'wide'] }])).to.deep.equal([
      { columns: [[], []], widths: [2, 1] },
    ]);
  });
  it('should keep a section with widths but non-array columns untouched', () => {
    const sectionBoxes = [{ columns: 'invalid', widths: [2, 1] }];
    expect(normalizeDashboardBoxes(sectionBoxes)).to.equal(sectionBoxes);
  });
});
