const { expect, assert } = require('chai');
const { generate } = require('../../utils/password');
const { BadParameters } = require('../../utils/coreErrors');

describe('password.generate', () => {
  it('should contains only 20 numbers', () => {
    const password = generate(20, { number: true });
    expect(password).to.match(/^\d{20}$/);
  });

  it('should contains only 20 lowercase alphabetical', () => {
    const password = generate(20, { lowercase: true });
    expect(password).to.match(/^[a-z]{20}$/);
  });

  it('should contains only 20 uppercase alphabetical', () => {
    const password = generate(20, { uppercase: true });
    expect(password).to.match(/^[A-Z]{20}$/);
  });

  it('should contains only 20 special chars', () => {
    const password = generate(20, { symbol: true });
    expect(password).to.be.lengthOf(20);
    expect(password).to.not.match(/[a-zA-Z0-9]/);
  });

  it('should contains mixing 20 chars, but no special', () => {
    const password = generate(20, { number: true, lowercase: true, uppercase: true });
    expect(password).to.match(/^[a-zA-Z0-9]{20}$/);
  });

  it('no params, should be length of 20', () => {
    const password = generate();
    expect(password).to.be.lengthOf(20);
  });

  it('should be length of 30', () => {
    const password = generate(30);
    expect(password).to.be.lengthOf(30);
  });

  it('should be errorneous', () => {
    try {
      generate(30, { number: false, lowercase: false, uppercase: false, special: false });
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }
  });
});
