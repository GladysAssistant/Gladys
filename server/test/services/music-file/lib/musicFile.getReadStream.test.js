const { assert } = require('chai');

const MusicFileHandler = require('../../../../services/music-file/lib');

describe('Music File handler getReadStream', () => {
  const musicFileHandler = new MusicFileHandler({});

  it('should return read stream of mp3 music file', async () => {
    const readStream = await musicFileHandler.getReadStream(
      './test/services/music-file/resources/music-folder/file_example_MP3_700KB.mp3',
    );

    assert.equal(readStream.readable, true);
    assert.equal(readStream.writable, true);
  });

  it('should return read stream of wav music file', async () => {
    const readStream = await musicFileHandler.getReadStream(
      './test/services/music-file/resources/music-folder/file_example_WAV_1MG.wav',
    );

    assert.equal(readStream.readable, true);
    assert.equal(readStream.writable, true);
  });

  it('should return null for invalid file extension', async () => {
    const readStream = await musicFileHandler.getReadStream(
      './test/services/music-file/resources/music-folder/file_example_OOG_1MG.ogg',
    );

    assert.isUndefined(readStream);
  });

  it('should return null for not existing file', async () => {
    const readStream = await musicFileHandler.getReadStream(
      './test/services/music-file/resources/music-folder/test.flac',
    );

    assert.isUndefined(readStream);
  });
});
