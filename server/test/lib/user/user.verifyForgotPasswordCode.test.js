const { assert, expect } = require('chai');
const jwt = require('jsonwebtoken');

const User = require('../../../lib/user');
const Session = require('../../../lib/session');
const { RESET_CODE_MAX_ATTEMPTS } = require('../../../lib/user/user.verifyForgotPasswordCode');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('user.verifyForgotPasswordCode', () => {
  const session = new Session('secret');
  const user = new User(session);
  let code;

  beforeEach(async () => {
    user.forgotPasswordCodes.clear();
    ({ code } = await user.forgotPassword('demo@demo.com', 'chrome'));
  });

  it('should return a reset-password access token for the right code', async () => {
    const result = await user.verifyForgotPasswordCode('demo@demo.com', code, 'chrome');
    expect(Object.keys(result)).to.deep.equal(['access_token']);
    const decoded = jwt.verify(result.access_token, 'secret');
    expect(decoded.user_id).to.equal(USER_ID);
    expect(decoded.scope).to.deep.equal(['reset-password:write']);
    expect(decoded.exp - decoded.iat).to.be.at.most(15 * 60);
    // the code is one-time
    expect(user.forgotPasswordCodes.has(USER_ID)).to.equal(false);
    const promise = user.verifyForgotPasswordCode('demo@demo.com', code, 'chrome');
    return assert.isRejected(promise, 'Invalid or expired code');
  });

  it('should accept the code in lower case, with spaces and without the dash', async () => {
    const typed = ` ${code.replace('-', ' ').toLowerCase()} `;
    const result = await user.verifyForgotPasswordCode('demo@demo.com', typed, 'chrome');
    expect(result).to.have.property('access_token');
  });

  it('should reject a wrong code and keep the pending code', async () => {
    const promise = user.verifyForgotPasswordCode('demo@demo.com', 'AAAA-AAAA', 'chrome');
    await assert.isRejected(promise, 'Invalid or expired code');
    expect(user.forgotPasswordCodes.get(USER_ID).attempts).to.equal(1);
    const result = await user.verifyForgotPasswordCode('demo@demo.com', code, 'chrome');
    expect(result).to.have.property('access_token');
  });

  it('should reject a code of a different length or a non-string code', async () => {
    await assert.isRejected(user.verifyForgotPasswordCode('demo@demo.com', 'AAA', 'chrome'), 'Invalid or expired code');
    await assert.isRejected(
      user.verifyForgotPasswordCode('demo@demo.com', undefined, 'chrome'),
      'Invalid or expired code',
    );
    await assert.isRejected(
      user.verifyForgotPasswordCode('demo@demo.com', { code }, 'chrome'),
      'Invalid or expired code',
    );
  });

  it('should drop the code after too many wrong attempts', async () => {
    for (let i = 0; i < RESET_CODE_MAX_ATTEMPTS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await assert.isRejected(
        user.verifyForgotPasswordCode('demo@demo.com', 'AAAA-AAAA', 'chrome'),
        'Invalid or expired code',
      );
    }
    expect(user.forgotPasswordCodes.has(USER_ID)).to.equal(false);
    // even the right code is refused now
    const promise = user.verifyForgotPasswordCode('demo@demo.com', code, 'chrome');
    return assert.isRejected(promise, 'Invalid or expired code');
  });

  it('should reject an expired code', async () => {
    user.forgotPasswordCodes.get(USER_ID).valid_until = new Date(Date.now() - 1000);
    const promise = user.verifyForgotPasswordCode('demo@demo.com', code, 'chrome');
    await assert.isRejected(promise, 'Invalid or expired code');
    expect(user.forgotPasswordCodes.has(USER_ID)).to.equal(false);
  });

  it('should reject when no code is pending for the user', async () => {
    const promise = user.verifyForgotPasswordCode('pepper@pots.com', code, 'chrome');
    return assert.isRejected(promise, 'Invalid or expired code');
  });

  it('should reject an unknown email with the same error', async () => {
    const promise = user.verifyForgotPasswordCode('not-found@test.com', code, 'chrome');
    return assert.isRejected(promise, 'Invalid or expired code');
  });
});
