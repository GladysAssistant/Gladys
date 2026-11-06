const { expect } = require('chai');

const { buildTts } = require('./testUtils.test');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { GLADYS_PLUS_PROVIDER } = require('../../../lib/tts/constants');

describe('tts.getActiveProvider', () => {
  it('should default to Gladys Plus when no provider is stored', async () => {
    const { tts } = buildTts();
    expect(await tts.getActiveProvider()).to.equal(GLADYS_PLUS_PROVIDER);
  });

  it('should return the stored provider', async () => {
    const { tts, variableStore } = buildTts();
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    expect(await tts.getActiveProvider()).to.equal('ext-piper-tts');
  });
});
