const { expect } = require('chai');

const { buildTts } = require('./testUtils.test');
const { TTS_AUDIO_MAX_ENTRIES } = require('../../../lib/tts/constants');

describe('tts.purgeExpiredAudios', () => {
  it('should drop expired clips and keep the live ones', () => {
    const { tts } = buildTts();
    tts.audios.set('expired-token', {
      buffer: Buffer.from('old'),
      contentType: 'audio/mpeg',
      expiresAt: Date.now() - 1,
    });
    tts.audios.set('live-token', {
      buffer: Buffer.from('new'),
      contentType: 'audio/wav',
      expiresAt: Date.now() + 60 * 1000,
    });
    tts.purgeExpiredAudios();
    expect(tts.audios.has('expired-token')).to.equal(false);
    expect(tts.audios.has('live-token')).to.equal(true);
  });

  it('should evict the oldest live clips beyond the entry cap', () => {
    const { tts } = buildTts();
    for (let index = 0; index < TTS_AUDIO_MAX_ENTRIES + 3; index += 1) {
      tts.audios.set(`token-${index}`, {
        buffer: Buffer.from('bytes'),
        contentType: 'audio/mpeg',
        expiresAt: Date.now() + 60 * 1000,
      });
    }
    tts.purgeExpiredAudios();
    expect(tts.audios.size).to.equal(TTS_AUDIO_MAX_ENTRIES);
    // insertion order: the three oldest are gone, the newest are kept
    expect(tts.audios.has('token-0')).to.equal(false);
    expect(tts.audios.has('token-2')).to.equal(false);
    expect(tts.audios.has('token-3')).to.equal(true);
    expect(tts.audios.has(`token-${TTS_AUDIO_MAX_ENTRIES + 2}`)).to.equal(true);
  });

  it('should be a no-op on an empty cache', () => {
    const { tts } = buildTts();
    tts.purgeExpiredAudios();
    expect(tts.audios.size).to.equal(0);
  });
});
