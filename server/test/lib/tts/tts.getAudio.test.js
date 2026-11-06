const { expect } = require('chai');

const { buildTts } = require('./testUtils.test');
const { NotFoundError } = require('../../../utils/coreErrors');

describe('tts.getAudio', () => {
  it('should return the clip behind a live token', () => {
    const { tts } = buildTts();
    tts.audios.set('token-1', {
      buffer: Buffer.from('audio-bytes'),
      contentType: 'audio/mpeg',
      expiresAt: Date.now() + 60 * 1000,
    });
    const { buffer, contentType } = tts.getAudio('token-1');
    expect(buffer.equals(Buffer.from('audio-bytes'))).to.equal(true);
    expect(contentType).to.equal('audio/mpeg');
  });

  it('should throw on an unknown token', () => {
    const { tts } = buildTts();
    expect(() => tts.getAudio('unknown-token')).to.throw(NotFoundError, 'TTS_AUDIO_NOT_FOUND');
  });

  it('should purge expired clips lazily and throw on an expired token', () => {
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
    expect(() => tts.getAudio('expired-token')).to.throw(NotFoundError, 'TTS_AUDIO_NOT_FOUND');
    expect(tts.audios.has('expired-token')).to.equal(false);
    expect(tts.audios.has('live-token')).to.equal(true);
  });
});
