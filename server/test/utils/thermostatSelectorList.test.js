const { expect } = require('chai');

const { parseSelectorList, serializeSelectorList } = require('../../utils/thermostatSelectorList');

describe('thermostatSelectorList: parseSelectorList', () => {
  it('should read an empty param as no sensor', () => {
    expect(parseSelectorList(null)).to.deep.equal([]);
    expect(parseSelectorList(undefined)).to.deep.equal([]);
    expect(parseSelectorList('')).to.deep.equal([]);
  });

  it('should read a single selector, the format saved before several were allowed', () => {
    expect(parseSelectorList('salon-window')).to.deep.equal(['salon-window']);
  });

  it('should read a JSON array of selectors', () => {
    expect(parseSelectorList('["salon-window","kitchen-door"]')).to.deep.equal(['salon-window', 'kitchen-door']);
  });

  it('should accept an array as it is', () => {
    expect(parseSelectorList(['salon-window', 'kitchen-door'])).to.deep.equal(['salon-window', 'kitchen-door']);
  });

  it('should drop empty, duplicate and non-string entries', () => {
    expect(parseSelectorList('["a", "", " a ", 3, null, "b"]')).to.deep.equal(['a', 'b']);
  });

  it('should read a malformed array as a single selector rather than throw', () => {
    expect(parseSelectorList('[not json')).to.deep.equal(['[not json']);
  });

  it('should ignore a value that is not text', () => {
    expect(parseSelectorList(42)).to.deep.equal([]);
  });
});

describe('thermostatSelectorList: serializeSelectorList', () => {
  it('should store no sensor as an empty value', () => {
    expect(serializeSelectorList([])).to.equal('');
    expect(serializeSelectorList(null)).to.equal('');
  });

  it('should keep a single sensor as a plain selector', () => {
    expect(serializeSelectorList(['salon-window'])).to.equal('salon-window');
  });

  it('should store several sensors as a JSON array', () => {
    expect(serializeSelectorList(['salon-window', 'kitchen-door', 'salon-window'])).to.equal(
      '["salon-window","kitchen-door"]',
    );
  });
});
