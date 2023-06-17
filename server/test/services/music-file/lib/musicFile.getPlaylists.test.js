const { assert } = require('chai');

const MusicFileHandler = require('../../../../services/music-file/lib');

describe('Music File handler getPlaylists', () => {
  const musicFileHandler = new MusicFileHandler({});

  it('should return capabilities of music file provider', () => {
    musicFileHandler.init('./test/services/music-file/resources/music-folder', false);
    const playlists = musicFileHandler.getPlaylists();
    assert.equal(playlists.length, 1);
    assert.equal(playlists[0].label, 'file_example_MP3_700KB');
    assert.equal(playlists[0].value, 'file_example_MP3_700KB.m3u');
    assert.equal(playlists[0].path, './test/services/music-file/resources/music-folder/file_example_MP3_700KB.m3u');
  });
});
