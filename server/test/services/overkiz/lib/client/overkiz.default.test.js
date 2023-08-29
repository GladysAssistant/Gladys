const { expect } = require('chai');
const { DefaultLoginHandler } = require('../../../../../services/overkiz/lib/client/overkiz.default');

describe('Overkiz Default login', () => {
  const username = 'username';
  const password = 'password';

  it('should Default login', async () => {
    const overkizDefault = new DefaultLoginHandler(
      {
        jwt: true,
        configuration: {},
      },
      username,
      password,
    );
    await overkizDefault.login();
    expect(overkizDefault.username).to.equals(username);
    expect(overkizDefault.password).to.equals(password);
  });
});
