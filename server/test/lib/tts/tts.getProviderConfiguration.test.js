const { expect } = require('chai');

const db = require('../../../models');
const { buildTts, registerFakeTtsProvider } = require('./testUtils.test');
const { SYSTEM_VARIABLE_NAMES, SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('../../../lib/tts/constants');

describe('tts.getProviderConfiguration', () => {
  it('should expose the manifest name of an external provider as its display name', async () => {
    const { tts, stateManager } = buildTts();
    registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    await db.Service.create({
      name: 'ext-piper-tts',
      selector: 'ext-piper-tts',
      version: '1.0.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      manifest: { name: 'Piper TTS Demo' },
    });
    const { providers } = await tts.getProviderConfiguration();
    expect(providers).to.deep.equal([
      { provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' },
      { provider: 'ext-piper-tts', name: 'Piper TTS Demo', selector: 'ext-piper-tts', status: SERVICE_STATUS.RUNNING },
    ]);
  });

  it('should expose the status of a stopped provider so the voice card can warn', async () => {
    const { tts, stateManager } = buildTts();
    registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    await db.Service.create({
      name: 'ext-piper-tts',
      selector: 'ext-piper-tts-selector',
      version: '1.0.0',
      status: SERVICE_STATUS.STOPPED,
      type: SERVICE_TYPES.EXTERNAL,
      manifest: {},
    });
    const { providers } = await tts.getProviderConfiguration();
    expect(providers[1]).to.deep.equal({
      provider: 'ext-piper-tts',
      // no manifest name: raw selector fallback
      name: 'ext-piper-tts',
      selector: 'ext-piper-tts-selector',
      status: SERVICE_STATUS.STOPPED,
    });
  });

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
    // no t_service row: raw fallbacks, unknown status
    expect(configuration.providers).to.deep.equal([
      { provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' },
      { provider: 'ext-piper-tts', name: 'ext-piper-tts', selector: 'ext-piper-tts', status: null },
    ]);
  });
});
