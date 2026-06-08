const { expect } = require('chai');
const { fake, assert } = require('sinon');

const { Error429 } = require('../../../utils/httpErrors');
const { USER_ROLE } = require('../../../utils/constants');
const {
  sendWeeklyDigest,
  isSystemVariableEnabled,
  extractAssistantText,
} = require('../../../lib/gateway/gateway.sendWeeklyDigest');

describe('gateway.sendWeeklyDigest', () => {
  let gateway;

  beforeEach(() => {
    gateway = {
      variable: {
        getValue: fake.resolves('1'),
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
        sendToUser: fake.resolves({}),
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

  it('should send digest to admins', async () => {
    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 1 });
    assert.calledOnceWithExactly(gateway.user.getByRole, USER_ROLE.ADMIN);
    assert.calledOnce(gateway.aiChat);
    assert.calledOnceWithExactly(gateway.message.sendToUser, 'tony', 'Bonjour, voici votre bilan.');
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
    assert.notCalled(gateway.message.sendToUser);
  });

  it('should skip when AI rate limit is reached', async () => {
    gateway.aiChat = fake.rejects(new Error429('too many requests'));

    const result = await sendWeeklyDigest.call(gateway);

    expect(result).to.deep.equal({ sent: 0 });
    assert.notCalled(gateway.message.sendToUser);
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
    assert.calledOnceWithExactly(gateway.message.sendToUser, 'pierre', 'Digest OK');
  });
});

describe('isSystemVariableEnabled', () => {
  it('should detect enabled values', () => {
    expect(isSystemVariableEnabled('1')).to.equal(true);
    expect(isSystemVariableEnabled(true)).to.equal(true);
    expect(isSystemVariableEnabled(1)).to.equal(true);
    expect(isSystemVariableEnabled('true')).to.equal(true);
    expect(isSystemVariableEnabled('0')).to.equal(false);
    expect(isSystemVariableEnabled(false)).to.equal(false);
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
