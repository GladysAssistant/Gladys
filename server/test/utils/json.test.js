const { expect } = require('chai');
const { parseJsonIfJson } = require('../../utils/json');

describe('parseJsonIfJson', () => {
  it('should convert a json to object', () => {
    const object = parseJsonIfJson('{}');
    expect(object).to.deep.equal({});
  });
  it('should not convert number', () => {
    const number = parseJsonIfJson(1);
    expect(number).to.equal(1);
  });
  it('should not convert string', () => {
    const text = parseJsonIfJson('toto');
    expect(text).to.equal('toto');
  });
  it('should return null', () => {
    const res = parseJsonIfJson(null);
    expect(res).to.equal(null);
  });
  it('should convert json array to array', () => {
    const object = parseJsonIfJson('[{"test": "test"}]');
    expect(object).to.deep.equal([{ test: 'test' }]);
  });
});
