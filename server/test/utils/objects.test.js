const { expect } = require('chai');
const { areObjectsEqual, pick } = require('../../utils/objects');

describe('areObjectsEqual', () => {
  it('should return true', () => {
    const result = areObjectsEqual({ name: 'test' }, { name: 'test' }, ['name']);
    expect(result).to.be.true; // eslint-disable-line
  });
  it('should return false', () => {
    const result = areObjectsEqual({ name: 'test' }, { name: 'modified' }, ['name']);
    expect(result).to.be.false; // eslint-disable-line
  });
  it('should return true, property is irrelevant', () => {
    const result = areObjectsEqual({ name: 'test' }, { name: 'modified' }, []);
    expect(result).to.be.true; // eslint-disable-line
  });
  it('should return true', () => {
    const result = areObjectsEqual({ name: 'test', id: 1 }, { name: 'test', id: 2 }, ['name']);
    expect(result).to.be.true; // eslint-disable-line
  });
});

describe('pick', () => {
  it('should return only id property', () => {
    const result = pick({ name: 'test', id: 1 }, ['id']);
    expect(result).to.deep.equal({
      id: 1,
    });
  });
  it('should return empty object', () => {
    const result = pick({ name: 'test', id: 1 }, []);
    expect(result).to.deep.equal({});
  });
  it('should return full object', () => {
    const result = pick({ name: 'test', id: 1 }, ['name', 'id']);
    expect(result).to.deep.equal({
      id: 1,
      name: 'test',
    });
  });
});
