const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { sendWeeklyDigest } = require('../../../lib/gateway/gateway.sendWeeklyDigest');

const WEEKLY_DIGEST_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../../config/prompts/weeklyDigest.prompt.txt'),
  'utf8',
);

describe('weeklyDigest.prompt.txt', () => {
  it('should tell the AI to write numbers with the decimal separator given in the request', () => {
    // the payload is JSON, where numbers always use a period: the AI must not
    // copy them as they are (111.34 kWh in a French digest)
    expect(WEEKLY_DIGEST_PROMPT).to.include(
      'Numbers in the JSON payload always use a period as decimal separator. Never copy that format',
    );
    expect(WEEKLY_DIGEST_PROMPT).to.include(
      'write every decimal number with the decimal separator given in the request, a comma in French, Spanish and German',
    );
    expect(WEEKLY_DIGEST_PROMPT).to.include('a period in English (111.34 kWh)');
  });

  it('should ask for costs with exactly two decimals, trailing zeros included', () => {
    expect(WEEKLY_DIGEST_PROMPT).to.include(
      'Write costs with exactly two decimals, adding trailing zeros when the payload has fewer',
    );
  });

  it('should keep the payload precision for other values and cap kWh at two decimals', () => {
    expect(WEEKLY_DIGEST_PROMPT).to.include(
      'For every other value, never write more decimals than the payload has, and never more than two decimals for kWh.',
    );
  });

  it('should be the system prompt of the weekly digest request', async () => {
    const gateway = {
      variable: {
        getValue: fake(async (name) => (name === SYSTEM_VARIABLE_NAMES.AI_PROVIDER ? null : '1')),
      },
      getStatus: fake.resolves({ configured: true }),
      device: {},
      scene: {},
      user: {
        getByRole: fake.resolves([{ id: 'user-1', selector: 'tony', language: 'fr' }]),
      },
      buildWeeklyDigestData: fake.resolves({ summary: { device_count: 2 } }),
      aiChat: fake.resolves({ choices: [{ message: { content: 'Bonjour' } }] }),
      message: {
        sendSystemMessage: fake.resolves({}),
      },
    };

    await sendWeeklyDigest.call(gateway);

    expect(gateway.aiChat.getCall(0).args[0].messages[0]).to.deep.equal({
      role: 'system',
      content: WEEKLY_DIGEST_PROMPT,
    });
  });
});
