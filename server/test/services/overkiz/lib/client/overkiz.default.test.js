const sinon = require('sinon');
const { expect } = require('chai');

const { assert } = sinon;
const { DefaultLoginHandler } = require('../../../../../services/overkiz/lib/client/overkiz.default');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

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

  it('should Default login - not configured', async () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const overkizDefault = new DefaultLoginHandler(
        {
          jwt: false,
          configuration: {},
        },
        username,
        password,
      );
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.be.equal('');
    }
  });
});
