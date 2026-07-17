const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const db = require('../../../models');
const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_COMMUNICATION_MANIFEST } = require('./testUtils.test');
const { CONTACT_VARIABLE } = require('../../../lib/external-integration/constants');

// John, seeded by the test database
const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const seedCommunicationService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_COMMUNICATION_MANIFEST, has_message_feature: true, ...overrides });

describe('externalIntegration.createLinkCode / linkContact', () => {
  it('should link a contact with a valid code, single use', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedCommunicationService();
    const { code, expires_at: expiresAt } = await externalIntegration.createLinkCode(service.selector, JOHN_USER_ID);
    expect(code).to.have.lengthOf(8);
    expect(new Date(expiresAt).getTime()).to.be.greaterThan(Date.now());
    const result = await externalIntegration.linkContact(service, {
      code,
      contact_id: 'signal-12345',
      contact_name: 'John on Signal',
    });
    expect(result.user).to.deep.equal({ selector: 'john', first_name: 'John', language: 'en' });
    const contact = await externalIntegration.getContactForUser(service, JOHN_USER_ID);
    expect(contact.contact_id).to.equal('signal-12345');
    expect(contact.contact_name).to.equal('John on Signal');
    // single use: the code died with the first attempt
    await expect(externalIntegration.linkContact(service, { code, contact_id: 'signal-6789' })).to.be.rejectedWith(
      NotFoundError,
    );
  });

  it('should reject a malformed link request', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedCommunicationService();
    await expect(externalIntegration.linkContact(service, { contact_id: 'x' })).to.be.rejectedWith(BadParameters);
    await expect(externalIntegration.linkContact(service, { code: 'ABCD' })).to.be.rejectedWith(BadParameters);
    await expect(
      externalIntegration.linkContact(service, { code: 'ABCD', contact_id: 'x', contact_name: 42 }),
    ).to.be.rejectedWith(BadParameters);
  });

  it('should reject an unknown or expired code', async () => {
    const { externalIntegration, cache } = buildSupervisor();
    const service = await seedCommunicationService();
    await expect(externalIntegration.linkContact(service, { code: 'UNKNOWN1', contact_id: 'x' })).to.be.rejectedWith(
      NotFoundError,
    );
    const { code } = await externalIntegration.createLinkCode(service.selector, JOHN_USER_ID);
    // force the expiry
    const cacheKey = `external-integration-link-code:${service.id}:${code}`;
    cache.set(cacheKey, { userId: JOHN_USER_ID, expiresAt: Date.now() - 1000 });
    await expect(externalIntegration.linkContact(service, { code, contact_id: 'x' })).to.be.rejectedWith(NotFoundError);
  });

  it('should reject a code bound to a deleted user', async () => {
    const { externalIntegration, cache } = buildSupervisor();
    const service = await seedCommunicationService();
    const { code } = await externalIntegration.createLinkCode(service.selector, JOHN_USER_ID);
    const cacheKey = `external-integration-link-code:${service.id}:${code}`;
    cache.set(cacheKey, { userId: 'e2c85162-9d92-4d24-a778-98b4d2ec7568', expiresAt: Date.now() + 10000 });
    await expect(externalIntegration.linkContact(service, { code, contact_id: 'x' })).to.be.rejectedWith(NotFoundError);
  });
});

describe('externalIntegration.getContactForUser / getLinkedContacts / unlinkContact', () => {
  it('should return null without link, and survive an invalid stored contact', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    expect(await externalIntegration.getContactForUser(service, JOHN_USER_ID)).to.equal(null);
    await variable.setValue(CONTACT_VARIABLE, 'not-json', service.id, JOHN_USER_ID);
    expect(await externalIntegration.getContactForUser(service, JOHN_USER_ID)).to.equal(null);
    const contacts = await externalIntegration.getLinkedContacts(service);
    expect(contacts).to.deep.equal([]);
  });

  it('should list the linked contacts with their user', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(
      CONTACT_VARIABLE,
      JSON.stringify({ contact_id: 'signal-12345', contact_name: null, linked_at: '2026-07-17T10:00:00.000Z' }),
      service.id,
      JOHN_USER_ID,
    );
    const contacts = await externalIntegration.getLinkedContacts(service);
    expect(contacts).to.deep.equal([
      {
        contact_id: 'signal-12345',
        contact_name: null,
        linked_at: '2026-07-17T10:00:00.000Z',
        user: { selector: 'john', first_name: 'John', language: 'en' },
      },
    ]);
  });

  it('should unlink the account of the user (idempotent)', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    await externalIntegration.unlinkContact(service.selector, JOHN_USER_ID);
    expect(await externalIntegration.getContactForUser(service, JOHN_USER_ID)).to.equal(null);
    // idempotent
    await externalIntegration.unlinkContact(service.selector, JOHN_USER_ID);
  });
});

describe('externalIntegration.handleIncomingMessage', () => {
  it('should emit the standard message event for a linked contact', async () => {
    const { externalIntegration, event, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    const result = await externalIntegration.handleIncomingMessage(service, {
      contact_id: 'signal-12345',
      text: 'Turn on the light',
      created_at: '2026-07-17T10:00:00.000Z',
    });
    expect(result).to.deep.equal({ success: true });
    assert.calledOnce(event.emit);
    const [eventType, payload] = event.emit.firstCall.args;
    expect(eventType).to.equal(EVENTS.MESSAGE.NEW);
    expect(payload.source).to.equal(service.selector);
    expect(payload.source_user_id).to.equal('signal-12345');
    expect(payload.user_id).to.equal(JOHN_USER_ID);
    expect(payload.user).to.have.property('selector', 'john');
    expect(payload.user).to.not.have.property('password');
    expect(payload.language).to.equal('en');
    expect(payload.text).to.equal('Turn on the light');
    expect(payload.created_at).to.equal('2026-07-17T10:00:00.000Z');
    expect(payload.id).to.be.a('string');
  });

  it('should default created_at to now', async () => {
    const { externalIntegration, event, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    await externalIntegration.handleIncomingMessage(service, { contact_id: 'signal-12345', text: 'hello' });
    const [, payload] = event.emit.firstCall.args;
    expect(Number.isNaN(Date.parse(payload.created_at))).to.equal(false);
  });

  it('should reject malformed messages', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedCommunicationService();
    await expect(externalIntegration.handleIncomingMessage(service, { text: 'hello' })).to.be.rejectedWith(
      BadParameters,
    );
    await expect(externalIntegration.handleIncomingMessage(service, { contact_id: 'x' })).to.be.rejectedWith(
      BadParameters,
    );
    await expect(
      externalIntegration.handleIncomingMessage(service, { contact_id: 'x', text: 'a'.repeat(5000) }),
    ).to.be.rejectedWith(BadParameters);
    await expect(
      externalIntegration.handleIncomingMessage(service, { contact_id: 'x', text: 'hello', created_at: 'not-a-date' }),
    ).to.be.rejectedWith(BadParameters);
  });

  it('should return 404 for an unknown contact, ignoring invalid stored links', async () => {
    const { externalIntegration, event, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, 'not-json', service.id, JOHN_USER_ID);
    await expect(
      externalIntegration.handleIncomingMessage(service, { contact_id: 'unknown-contact', text: 'hello' }),
    ).to.be.rejectedWith(NotFoundError);
    assert.notCalled(event.emit);
  });

  it('should return 404 for a contact linked to a deleted user', async () => {
    const { externalIntegration, event, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    const findOneStub = sinon.stub(db.User, 'findOne').resolves(null);
    try {
      await expect(
        externalIntegration.handleIncomingMessage(service, { contact_id: 'signal-12345', text: 'hello' }),
      ).to.be.rejectedWith(NotFoundError);
    } finally {
      findOneStub.restore();
    }
    assert.notCalled(event.emit);
  });

  it('should not resolve a contact linked to another integration', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    const otherService = await seedCommunicationService({
      name: 'ext-dev-other-bridge',
      selector: 'ext-dev-other-bridge',
    });
    // the contact is linked to the OTHER integration only
    await variable.setValue(
      CONTACT_VARIABLE,
      JSON.stringify({ contact_id: 'signal-12345' }),
      otherService.id,
      JOHN_USER_ID,
    );
    await expect(
      externalIntegration.handleIncomingMessage(service, { contact_id: 'signal-12345', text: 'hello' }),
    ).to.be.rejectedWith(NotFoundError);
  });
});

describe('externalIntegration.registerProxyService (communication)', () => {
  it('should expose the outbound message interface for communication integrations', async () => {
    const { externalIntegration, stateManager, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    externalIntegration.sendCommand = fake.resolves({ success: true });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    expect(proxyService.message).to.have.property('send');
    expect(proxyService.message).to.have.property('sendToUser');
    // reply path: by contact id
    await proxyService.message.send('signal-12345', { text: 'hello', file: 'file-content' });
    assert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MESSAGE_SEND,
      { contact_id: 'signal-12345', message: { text: 'hello', file: 'file-content' } },
    );
    // sendToUser path: no-op when the user is not linked
    await proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' });
    assert.calledOnce(externalIntegration.sendCommand);
    // linked: resolves the contact itself
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    await proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' });
    expect(externalIntegration.sendCommand.callCount).to.equal(2);
    expect(externalIntegration.sendCommand.secondCall.args[2]).to.deep.equal({
      contact_id: 'signal-12345',
      message: { text: 'hello', file: null },
    });
  });

  it('should not expose the message interface for device integrations', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedExternalService();
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    expect(proxyService.message).to.equal(undefined);
  });
});
