const Variable = require('../../../lib/variable');

describe('variable.destroy', () => {
  const variable = new Variable();
  it('should destroy an existing variable', async () => {
    await variable.destroy(
      'USER_SECURE_VARIABLE',
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );
  });
  it('should destroy a non existing variable', async () => {
    await variable.destroy(
      'THIS_VARIABLE_DOES_NOT_EXIST',
      'a810b8db-6d04-4697-bed3-c4b72c996279',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    );
  });
});
