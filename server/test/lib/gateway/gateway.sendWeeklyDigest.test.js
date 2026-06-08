const { expect } = require('chai');
const { fake, assert } = require('sinon');

const { USER_ROLE } = require('../../../utils/constants');
const { sendWeeklyDigest, isSystemVariableEnabled } = require('../../../lib/gateway/gateway.sendWeeklyDigest');

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
});

describe('isSystemVariableEnabled', () => {
  it('should detect enabled values', () => {
    expect(isSystemVariableEnabled('1')).to.equal(true);
    expect(isSystemVariableEnabled(true)).to.equal(true);
    expect(isSystemVariableEnabled('0')).to.equal(false);
    expect(isSystemVariableEnabled(false)).to.equal(false);
  });
});
