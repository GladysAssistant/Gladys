const { expect } = require('chai');

const { buildTts } = require('./testUtils.test');

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

  it('should be a no-op on an empty cache', () => {
    const { tts } = buildTts();
    tts.purgeExpiredAudios();
    expect(tts.audios.size).to.equal(0);
  });
});
