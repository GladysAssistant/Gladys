const { expect } = require('chai');

const Variable = require('../../../lib/variable');

describe('variable.getValue', () => {
  const variable = new Variable();
  it('should return an existing variable value', async () => {
    const result = await variable.getValue('SECURE_VARIABLE', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(result).to.equal('VALUE');
  });
  it('should return an existing user variable value', async () => {
    const result = await variable.getValue(
      'USER_SECURE_VARIABLE',
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );
    expect(result).to.equal('USER_VALUE');
  });
  it('should return null', async () => {
    const result = await variable.getValue('UNKNOWN', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(result).to.be.null; // eslint-disable-line
  });
  it('should return null', async () => {
    const result = await variable.getValue('SECURE_VARIABLE');
    expect(result).to.be.null; // eslint-disable-line
  });
});
