const { expect } = require('chai');
const { isSystemVariableEnabled } = require('../../utils/systemVariable');

describe('isSystemVariableEnabled', () => {
  it('should detect enabled values', () => {
    expect(isSystemVariableEnabled('1')).to.equal(true);
    expect(isSystemVariableEnabled(true)).to.equal(true);
    expect(isSystemVariableEnabled(1)).to.equal(true);
    expect(isSystemVariableEnabled('true')).to.equal(true);
    expect(isSystemVariableEnabled('0')).to.equal(false);
    expect(isSystemVariableEnabled(false)).to.equal(false);
  });
  it('should detect disabled values stored as text', () => {
    expect(isSystemVariableEnabled('false')).to.equal(false);
    expect(isSystemVariableEnabled(null)).to.equal(false);
  });
});
