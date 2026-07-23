const { expect } = require('chai');

const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { generateAccessToken } = require('../../../utils/accessToken');
const { buildSupervisor, seedExternalService, TEST_JWT_SECRET } = require('./testUtils.test');

describe('externalIntegration.validateToken', () => {
  it('should validate a valid integration token', async () => {
    const service = await seedExternalService({ token_version: 3 });
    const { externalIntegration } = buildSupervisor();
    const token = generateIntegrationToken(service.id, 3, TEST_JWT_SECRET);
    const validatedService = await externalIntegration.validateToken(token);
    expect(validatedService).to.have.property('id', service.id);
  });

  it('should reject a revoked token (old token_version)', async () => {
    const service = await seedExternalService({ token_version: 3 });
    const { externalIntegration } = buildSupervisor();
    const token = generateIntegrationToken(service.id, 2, TEST_JWT_SECRET);
    try {
      await externalIntegration.validateToken(token);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.equal('INTEGRATION_TOKEN_REVOKED');
    }
  });

  it('should reject a token of a destroyed integration', async () => {
    const { externalIntegration } = buildSupervisor();
    const token = generateIntegrationToken('4756151c-369e-4fbd-8794-1c4a55b4c8f9', 1, TEST_JWT_SECRET);
    try {
      await externalIntegration.validateToken(token);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_NOT_FOUND');
    }
  });

  it('should reject a user access token (wrong audience)', async () => {
    await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const userToken = generateAccessToken('user-id', ['dashboard:write'], 'session-id', TEST_JWT_SECRET);
    try {
      await externalIntegration.validateToken(userToken);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.include('audience');
    }
  });

  it('should reject a token signed with another secret', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const token = generateIntegrationToken(service.id, 1, 'wrong-secret');
    try {
      await externalIntegration.validateToken(token);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.message).to.include('signature');
    }
  });
});
