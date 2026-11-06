const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const { buildTts } = require('./testUtils.test');
const { USER_ROLE } = require('../../../utils/constants');

describe('tts.getDefaultLanguage', () => {
  it('should return the language of the first administrator', async () => {
    const { tts, user } = buildTts({
      user: { getByRole: fake.resolves([{ language: 'fr' }, { language: 'en' }]) },
    });
    expect(await tts.getDefaultLanguage()).to.equal('fr');
    sinon.assert.calledWith(user.getByRole, USER_ROLE.ADMIN);
  });

  it('should return null without any administrator or language', async () => {
    const { tts } = buildTts();
    expect(await tts.getDefaultLanguage()).to.equal(null);
    const { tts: ttsWithoutLanguage } = buildTts({ user: { getByRole: fake.resolves([{ language: null }]) } });
    expect(await ttsWithoutLanguage.getDefaultLanguage()).to.equal(null);
  });
});
