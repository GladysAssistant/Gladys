const { expect } = require('chai');
const { compare } = require('../../utils/compare');

describe('compare.=', () => {
  it('should return false', () => {
    const value = compare('=', 1, 2);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('=', 1, 1);
    expect(value).to.equal(true);
  });
});

describe('compare.!=', () => {
  it('should return false', () => {
    const value = compare('!=', 1, 1);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('!=', 1, 2);
    expect(value).to.equal(true);
  });
});

describe('compare.<', () => {
  it('should return false', () => {
    const value = compare('<', 1, 0);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('<', 1, 2);
    expect(value).to.equal(true);
  });
});

describe('compare.>', () => {
  it('should return false', () => {
    const value = compare('>', 1, 2);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('>', 1, 0);
    expect(value).to.equal(true);
  });
});

describe('compare.<=', () => {
  it('should return false', () => {
    const value = compare('<=', 1, 0);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('<=', 1, 2);
    expect(value).to.equal(true);
  });
  it('should return true', () => {
    const value = compare('<=', 1, 1);
    expect(value).to.equal(true);
  });
});

describe('compare.>=', () => {
  it('should return false', () => {
    const value = compare('>=', 1, 2);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('>=', 1, 0);
    expect(value).to.equal(true);
  });
  it('should return true', () => {
    const value = compare('>=', 1, 1);
    expect(value).to.equal(true);
  });
});

describe('compare.~=', () => {
  it('should return false', () => {
    const value = compare('~=', 1, 2);
    expect(value).to.equal(false);
  });
  it('should return true', () => {
    const value = compare('~=', 1, 1);
    expect(value).to.equal(true);
  });
  it('should return true', () => {
    const value = compare('~=', 'test', '[a-z]');
    expect(value).to.equal(true);
  });
  it('should return false', () => {
    const value = compare('~=', 'test1', '^[a-z]$');
    expect(value).to.equal(false);
  });
  it('should return true mix', () => {
    const value1 = compare('~=', 'Papa/maman', 'Papa');
    expect(value1).to.equal(true);
    const value2 = compare('~=', 'Papa/maman', 'Maman');
    expect(value2).to.equal(true);
    const value3 = compare('~=', 'Papa/maman', 'Papa/maman');
    expect(value3).to.equal(true);
  });
});

describe('compare.unknown', () => {
  it('should throw an error', () => {
    expect(() => {
      compare('unkwnown', 1, 2);
    }).to.throw(Error, 'Operator unkwnown not found');
  });
});
