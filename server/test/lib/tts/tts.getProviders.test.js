const { expect } = require('chai');

const { buildTts, registerFakeTtsProvider } = require('./testUtils.test');
const { GLADYS_PLUS_PROVIDER } = require('../../../lib/tts/constants');

describe('tts.getProviders', () => {
  it('should always list the built-in Gladys Plus provider', () => {
    const { tts } = buildTts();
    expect(tts.getProviders()).to.deep.equal([{ provider: GLADYS_PLUS_PROVIDER }]);
  });

  it('should list every service exposing tts.synthesize, and only those', () => {
    const { tts, stateManager } = buildTts();
    registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    // a device service without the tts capability is not a provider
    stateManager.setState('service', 'philips-hue', { device: {} });
    // a service exposing a non-callable tts.synthesize is not a provider
    stateManager.setState('service', 'broken-service', { tts: { synthesize: 'not-a-function' } });
    expect(tts.getProviders()).to.deep.equal([{ provider: GLADYS_PLUS_PROVIDER }, { provider: 'ext-piper-tts' }]);
  });
});
