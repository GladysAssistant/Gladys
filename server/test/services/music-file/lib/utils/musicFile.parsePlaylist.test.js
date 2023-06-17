const { expect } = require('chai');

const MusicFileHandler = require('../../../../../services/music-file/lib');

describe('Music File handler parsePlaylist', async () => {
  it('should parse playlist', async () => {
    const musicFileHandler = new MusicFileHandler({});
    const playlist = await musicFileHandler.parsePlaylist(
      './test/services/music-file/resources/music-folder/file_example_MP3_700KB.m3u',
    );

    expect(playlist.medias.length).to.eq(3);
  });
});
