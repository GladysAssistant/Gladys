const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { Error429 } = require('../../../utils/httpErrors');
const { USER_ROLE, AI_CHAT_PURPOSES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { sendWeeklyDigest, extractAssistantText } = require('../../../lib/gateway/gateway.sendWeeklyDigest');

describe('gateway.sendWeeklyDigest', () => {
  let gateway;

  beforeEach(() => {
    gateway = {
      variable: {
        // digest enabled, no external AI provider selected
        getValue: fake(async (name) => (name === SYSTEM_VARIABLE_NAMES.AI_PROVIDER ? null : '1')),
      },
      getStatus: fake.resolves({ configured: true }),
      device: {},
      scene: {},
      user: {
        getByRole: fake.resolves([
          {
            id: 'user-1',
            selector: 'tony',
            language: 'fr',
          },
        ]),
      },
      buildWeeklyDigestData: fake.resolves({
        summary: { device_count: 2 },
      }),
      aiChat: fake.resolves({
        choices: [{ message: { content: 'Bonjour, voici votre bilan.' } }],
      }),
      message: {
        sendSystemMessage: fake.resolves({}),
      },
    };
  });

  it('should skip when disabled', async () => {
    gateway.variable.getValue = fake.resolves('0');

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.buildWeeklyDigestData);
  });

  it('should skip when Gladys Plus is not configured', async () => {
    gateway.getStatus = fake.resolves({ configured: false });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.buildWeeklyDigestData);
  });

  it('should skip when the Gladys Plus subscription is not paid', async () => {
    gateway.getStatus = fake.resolves({ configured: true, subscription_active: false });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.buildWeeklyDigestData);
    assert.notCalled(gateway.aiChat);
  });

  it('should send the digest through an external AI provider without Gladys Plus', async () => {
    // the digest follows the selected provider (gateway.aiChat): neither a
    // Plus account nor an active subscription gates it then
    gateway.variable.getValue = fake(async (name) =>
      name === SYSTEM_VARIABLE_NAMES.AI_PROVIDER ? 'ext-dev-claude-provider-demo' : '1',
    );
    gateway.getStatus = fake.resolves({ configured: false, subscription_active: false });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 1 });
    assert.notCalled(gateway.getStatus);
    assert.calledOnce(gateway.aiChat);
  });

  it('should ask the AI for one admin at a time', async () => {
    // the digests of several admins must never overlap: a provider has a
    // cap on requests in flight, and a digest is not time-critical
    gateway.user.getByRole = fake.resolves(
      Array.from({ length: 6 }, (unused, index) => ({
        id: `user-${index}`,
        selector: `admin-${index}`,
        language: 'fr',
      })),
    );
    let inFlight = 0;
    let maxInFlight = 0;
    gateway.aiChat = fake(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => {
        setTimeout(resolve, 1);
      });
      inFlight -= 1;
      return { choices: [{ message: { content: 'Digest OK' } }] };
    });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 6 });
    expect(gateway.aiChat.callCount).to.equal(6);
    expect(maxInFlight).to.equal(1);
  });

  it('should send digest to admins', async () => {
    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 1 });
    assert.calledOnceWithExactly(gateway.user.getByRole, USER_ROLE.ADMIN);
    assert.calledOnce(gateway.aiChat);
    expect(gateway.aiChat.getCall(0).args[0].purpose).to.equal(AI_CHAT_PURPOSES.WEEKLY_DIGEST);
    assert.calledOnceWithExactly(gateway.message.sendSystemMessage, 'tony', 'Bonjour, voici votre bilan.', null, {
      messageType: 'notification',
    });
  });

  it('should force send when requested', async () => {
    gateway.variable.getValue = fake.resolves('0');

    const result = await sendWeeklyDigest.call(gateway, { force: true });

    expect(result).to.deep.equal({ sent: 1 });
    assert.calledOnce(gateway.buildWeeklyDigestData);
  });

  it('should skip when device or scene is missing', async () => {
    gateway.device = null;

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.buildWeeklyDigestData);
  });

  it('should skip when there are no admins', async () => {
    gateway.user.getByRole = fake.resolves([]);

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.buildWeeklyDigestData);
  });

  it('should skip when AI returns an empty digest', async () => {
    gateway.aiChat = fake.resolves({
      choices: [{ message: { content: '   ' } }],
    });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.message.sendSystemMessage);
  });

  it('should skip when AI rate limit is reached', async () => {
    gateway.aiChat = fake.rejects(new Error429('too many requests'));

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.message.sendSystemMessage);
  });

  it('should continue when digest fails for one admin', async () => {
    let callCount = 0;
    gateway.user.getByRole = fake.resolves([
      { id: 'user-1', selector: 'tony', language: 'fr' },
      { id: 'user-2', selector: 'pierre', language: 'fr' },
    ]);
    gateway.aiChat = fake(async () => {
      callCount += 1;
      if (callCount === 1) {
        throw new Error('network error');
      }
      return {
        choices: [{ message: { content: 'Digest OK' } }],
      };
    });

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 1 });
    assert.calledOnceWithExactly(gateway.message.sendSystemMessage, 'pierre', 'Digest OK', null, {
      messageType: 'notification',
    });
  });
});

describe('extractAssistantText', () => {
  it('should extract assistant text from API response', () => {
    expect(
      extractAssistantText({
        choices: [{ message: { content: '  Hello home  ' } }],
      }),
    ).to.equal('Hello home');
  });

  it('should return empty string when content is missing', () => {
    expect(extractAssistantText({ choices: [{ message: {} }] })).to.equal('');
    expect(extractAssistantText({})).to.equal('');
  });
});
