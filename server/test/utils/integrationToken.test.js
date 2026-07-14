const { expect } = require('chai');
const jwt = require('jsonwebtoken');

const { generateIntegrationToken, validateIntegrationToken } = require('../../utils/integrationToken');
const { generateAccessToken } = require('../../utils/accessToken');

describe('integrationToken', () => {
  it('should generate and validate a stateless integration token', () => {
    const token = generateIntegrationToken('service-id', 4, 'secret');
    const payload = validateIntegrationToken(token, 'secret');
    expect(payload).to.have.property('service_id', 'service-id');
    expect(payload).to.have.property('token_version', 4);
    expect(payload).to.have.property('aud', 'integration');
    expect(payload).to.have.property('iss', 'gladys');
    // no expiration on purpose: revocation is done with token_version
    expect(payload).to.not.have.property('exp');
  });

  it('should reject a token signed with another secret', () => {
    const token = generateIntegrationToken('service-id', 1, 'other-secret');
    expect(() => validateIntegrationToken(token, 'secret')).to.throw(jwt.JsonWebTokenError);
  });

  it('should reject a user access token (audience user)', () => {
    const userToken = generateAccessToken('user-id', ['dashboard:write'], 'session-id', 'secret');
    expect(() => validateIntegrationToken(userToken, 'secret')).to.throw(jwt.JsonWebTokenError, /audience/);
  });
});
