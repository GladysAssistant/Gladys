const { expect } = require('chai');

const { buildTts, registerFakeTtsProvider } = require('./testUtils.test');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('../../../lib/tts/constants');

describe('tts.getProviderConfiguration', () => {
  it('should fall back to Gladys Plus when no provider is stored', async () => {
    const { tts } = buildTts();
    const configuration = await tts.getProviderConfiguration();
    expect(configuration).to.deep.equal({
      active: GLADYS_PLUS_PROVIDER,
      providers: [{ provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' }],
    });
  });

  it('should expose the stored active provider', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    const configuration = await tts.getProviderConfiguration();
    expect(configuration.active).to.equal('ext-piper-tts');
    expect(configuration.providers).to.deep.equal([
      { provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' },
      { provider: 'ext-piper-tts', name: 'ext-piper-tts' },
    ]);
  });
});
