const { expect } = require('chai');

const db = require('../../../models');
const { buildTts, registerFakeTtsProvider } = require('./testUtils.test');
const { Error422 } = require('../../../utils/httpErrors');
const { SYSTEM_VARIABLE_NAMES, SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('../../../lib/tts/constants');

describe('tts.setActiveProvider / tts.getProviderConfiguration', () => {
  it('should expose Gladys Plus as the default active provider', async () => {
    const { tts } = buildTts();
    expect(await tts.getProviderConfiguration()).to.deep.equal({
      active: GLADYS_PLUS_PROVIDER,
      providers: [{ provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' }],
    });
  });

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
      { provider: 'ext-piper-tts', name: 'Piper TTS Demo' },
    ]);
  });

  it('should persist a valid provider and return the new configuration', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    const configuration = await tts.setActiveProvider('ext-piper-tts');
    expect(configuration).to.deep.equal({
      active: 'ext-piper-tts',
      // no t_service row nor manifest name here: raw fallback
      providers: [
        { provider: GLADYS_PLUS_PROVIDER, name: 'Gladys Plus' },
        { provider: 'ext-piper-tts', name: 'ext-piper-tts' },
      ],
    });
    expect(variableStore.get(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)).to.equal('ext-piper-tts');
    // switching back to Gladys Plus is always possible
    const backToPlus = await tts.setActiveProvider(GLADYS_PLUS_PROVIDER);
    expect(backToPlus.active).to.equal(GLADYS_PLUS_PROVIDER);
  });

  it('should refuse a provider that is not available', async () => {
    const { tts, variable } = buildTts();
    await expect(tts.setActiveProvider('ext-gone-tts')).to.be.rejectedWith(Error422);
    expect(variable.setValue.callCount).to.equal(0);
  });
});
