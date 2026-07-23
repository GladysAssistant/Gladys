const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ForbiddenError, BadParameters } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { buildSupervisor, seedExternalService, TEST_NOTIFICATION_MANIFEST } = require('./testUtils.test');
const { CONTACT_PROFILE_VARIABLE } = require('../../../lib/external-integration/constants');

// John, seeded by the test database
const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const seedNotificationService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_NOTIFICATION_MANIFEST, has_message_feature: true, ...overrides });

describe('externalIntegration notification channels (messaging.receive false)', () => {
  describe('server-side guarantees of a send-only channel', () => {
    it('should refuse incoming messages with a 403: a notification channel never reaches the brain', async () => {
      const { externalIntegration, event } = buildSupervisor();
      const service = await seedNotificationService();
      await expect(
        externalIntegration.handleIncomingMessage(service, { contact_id: 'x', text: 'hello' }),
      ).to.be.rejectedWith(ForbiddenError);
      assert.notCalled(event.emit);
    });

    it('should refuse code-based linking on both sides: impossible by construction', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedNotificationService();
      await expect(externalIntegration.createLinkCode(service.selector, JOHN_USER_ID)).to.be.rejectedWith(
        ForbiddenError,
      );
      await expect(externalIntegration.linkContact(service, { code: 'ABCD2345', contact_id: 'x' })).to.be.rejectedWith(
        ForbiddenError,
      );
    });
  });

  describe('contact profile ("My account" values)', () => {
    it('should save, merge and mask the per-user values', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedNotificationService();
      // nothing configured yet
      const emptyProfile = await externalIntegration.getContactProfileForFront(service, JOHN_USER_ID);
      expect(emptyProfile).to.deep.equal({
        values: { username: null, access_token: null },
        configured_secrets: [],
        configured: false,
      });
      const savedProfile = await externalIntegration.saveContactProfile(service, JOHN_USER_ID, {
        username: '0612345678',
        access_token: 'secret-token',
      });
      expect(savedProfile).to.deep.equal({
        values: { username: '0612345678', access_token: null },
        configured_secrets: ['access_token'],
        configured: true,
      });
      // partial merge: a secret set to null means unchanged
      await externalIntegration.saveContactProfile(service, JOHN_USER_ID, {
        username: 'new-login',
        access_token: null,
      });
      const rawProfile = await externalIntegration.getContactProfile(service, JOHN_USER_ID);
      expect(rawProfile).to.deep.equal({ username: 'new-login', access_token: 'secret-token' });
    });

    it('should validate the values against the contact schema', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedNotificationService();
      await expect(externalIntegration.saveContactProfile(service, JOHN_USER_ID, null)).to.be.rejectedWith(
        BadParameters,
      );
      await expect(
        externalIntegration.saveContactProfile(service, JOHN_USER_ID, { unknown_key: 'x' }),
      ).to.be.rejectedWith(Error422);
      await expect(externalIntegration.saveContactProfile(service, JOHN_USER_ID, { username: 42 })).to.be.rejectedWith(
        Error422,
      );
    });

    it('should refuse values on an integration without contact schema', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedExternalService();
      await expect(externalIntegration.saveContactProfile(service, JOHN_USER_ID, { username: 'x' })).to.be.rejectedWith(
        Error422,
      );
    });

    it('should survive an invalid stored profile', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedNotificationService();
      await variable.setValue(CONTACT_PROFILE_VARIABLE, 'not-json', service.id, JOHN_USER_ID);
      expect(await externalIntegration.getContactProfile(service, JOHN_USER_ID)).to.equal(null);
    });

    it('should delete the values of the user (revocation gesture, idempotent)', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedNotificationService();
      await externalIntegration.saveContactProfile(service, JOHN_USER_ID, { username: '0612345678' });
      await externalIntegration.deleteContactProfile(service, JOHN_USER_ID);
      expect(await externalIntegration.getContactProfile(service, JOHN_USER_ID)).to.equal(null);
      // idempotent
      await externalIntegration.deleteContactProfile(service, JOHN_USER_ID);
    });
  });

  describe('registerProxyService (notification channel)', () => {
    it('should expose sendToUser only, resolving the contact_schema values as the identity', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedNotificationService();
      externalIntegration.sendCommand = fake.resolves({ success: true });
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      // no reply path: a notification channel never sources a message
      expect(proxyService.message.send).to.equal(undefined);
      expect(proxyService.message).to.have.property('sendToUser');
      // unconfigured user: silent no-op, exactly the sendToUser semantics
      await proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' });
      assert.notCalled(externalIntegration.sendCommand);
      // an empty saved profile is a no-op too
      await externalIntegration.saveContactProfile(service, JOHN_USER_ID, {});
      await proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' });
      assert.notCalled(externalIntegration.sendCommand);
      // configured user: the payload carries the contact_schema values
      await externalIntegration.saveContactProfile(service, JOHN_USER_ID, {
        username: '0612345678',
        access_token: 'secret-token',
      });
      await proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' });
      assert.calledOnce(externalIntegration.sendCommand);
      const [, type, payload] = externalIntegration.sendCommand.firstCall.args;
      expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MESSAGE_SEND);
      expect(payload).to.deep.equal({
        contact: { username: '0612345678', access_token: 'secret-token' },
        message: { text: 'hello', file: null },
      });
    });
  });
});
