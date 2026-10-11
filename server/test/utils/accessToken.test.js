const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { generateAccessToken, ACCESS_TOKEN_VALIDITY } = require('../../utils/accessToken');

const USER_ID = '31a4d8d9-bf39-49be-8588-dac2b8cfa74a';
const SESSION_ID = '2a2ccdbd-88ff-42a6-a7de-b98cb0cb3b20';

describe('generateAccessToken', () => {
  it('should generate a token valid 24 hours by default', () => {
    const token = generateAccessToken(USER_ID, ['dashboard:read'], SESSION_ID, 'secret');
    const decoded = jwt.verify(token, 'secret', { issuer: 'gladys', audience: 'user' });
    expect(decoded.user_id).to.equal(USER_ID);
    expect(decoded.session_id).to.equal(SESSION_ID);
    expect(decoded.scope).to.deep.equal(['dashboard:read']);
    expect(decoded.exp - decoded.iat).to.equal(ACCESS_TOKEN_VALIDITY);
  });
  it('should generate a shorter token when asked', () => {
    const token = generateAccessToken(USER_ID, ['reset-password:write'], SESSION_ID, 'secret', 15 * 60);
    const decoded = jwt.verify(token, 'secret');
    expect(decoded.exp - decoded.iat).to.equal(15 * 60);
  });
  it('should never generate a token valid more than 24 hours', () => {
    const token = generateAccessToken(USER_ID, ['dashboard:read'], SESSION_ID, 'secret', 365 * 24 * 60 * 60);
    const decoded = jwt.verify(token, 'secret');
    expect(decoded.exp - decoded.iat).to.equal(ACCESS_TOKEN_VALIDITY);
  });
});
