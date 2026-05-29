const { expect, assert } = require('chai');

const { Error400 } = require('../../../utils/httpErrors');
const {
  getAudioBufferFromRequest,
  getAudioContentTypeFromRequest,
} = require('../../../api/utils/getAudioBufferFromRequest');

describe('getAudioBufferFromRequest', () => {
  it('should return the request body when it is a non-empty buffer', () => {
    const body = Buffer.from('audio-data');
    const result = getAudioBufferFromRequest({ body });

    expect(result).to.equal(body);
  });

  it('should reject an empty buffer', () => {
    assert.throws(() => getAudioBufferFromRequest({ body: Buffer.alloc(0) }), Error400, 'Missing audio body');
  });

  it('should reject a missing body', () => {
    assert.throws(() => getAudioBufferFromRequest({ body: undefined }), Error400, 'Missing audio body');
  });

  it('should reject a non-buffer body', () => {
    assert.throws(() => getAudioBufferFromRequest({ body: { audio: 'test' } }), Error400, 'Missing audio body');
  });
});

describe('getAudioContentTypeFromRequest', () => {
  it('should return audio/* content types without parameters', () => {
    expect(getAudioContentTypeFromRequest({ headers: { 'content-type': 'audio/wav' } })).to.equal('audio/wav');
    expect(getAudioContentTypeFromRequest({ headers: { 'content-type': 'audio/webm; codecs=opus' } })).to.equal(
      'audio/webm',
    );
  });

  it('should return application/octet-stream when header is missing or invalid', () => {
    expect(getAudioContentTypeFromRequest({ headers: {} })).to.equal('application/octet-stream');
    expect(getAudioContentTypeFromRequest({ headers: { 'content-type': 'text/plain' } })).to.equal(
      'application/octet-stream',
    );
  });
});
