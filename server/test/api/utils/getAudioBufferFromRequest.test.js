const { expect, assert } = require('chai');

const { Error400 } = require('../../../utils/httpErrors');
const { getAudioBufferFromRequest } = require('../../../api/utils/getAudioBufferFromRequest');

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
