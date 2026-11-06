const { expect, assert } = require('chai');
const User = require('../../../lib/user');
const { BadParameters, NotFoundError, PasswordNotMatchingError } = require('../../../utils/coreErrors');

describe('user.login', () => {
  const user = new User();
  it('should login with the email as stored', async () => {
    const loggedUser = await user.login('demo@demo.com', 'mysuperpassword');
    expect(loggedUser).to.have.property('email', 'demo@demo.com');
    expect(loggedUser).not.to.have.property('password');
  });
  it('should login with an email typed with capitals and spaces (phone keyboard)', async () => {
    const loggedUser = await user.login(' Demo@Demo.com ', 'mysuperpassword');
    expect(loggedUser).to.have.property('email', 'demo@demo.com');
  });
  it('should reject an unknown email', async () => {
    const promise = user.login('not-found@demo.com', 'mysuperpassword');
    return assert.isRejected(promise, NotFoundError);
  });
  it('should reject a wrong password', async () => {
    const promise = user.login('demo@demo.com', 'wrong');
    return assert.isRejected(promise, PasswordNotMatchingError);
  });
  it('should reject an email which is not a string', async () => {
    const promise = user.login(['demo@demo.com'], 'mysuperpassword');
    return assert.isRejected(promise, BadParameters);
  });
});
