const { expect } = require('chai');

const Variable = require('../../../lib/variable');

describe('variable.getVariables', () => {
  const variable = new Variable();
  it('should return an array with one variable', async () => {
    const result = await variable.getVariables('USER_SECURE_VARIABLE', 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(result).to.eql([
      {
        value: 'USER_VALUE',
        user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    ]);
  });
});
