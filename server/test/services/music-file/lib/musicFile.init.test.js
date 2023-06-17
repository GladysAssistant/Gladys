const { assert } = require('chai');

const MusicFileHandler = require('../../../../services/music-file/lib');
const { MUSIC } = require('../../../../utils/constants');

describe('Music File handler init', () => {
  const musicFileHandler = new MusicFileHandler({});
  musicFileHandler.readSubDirectory = MUSIC.PROVIDER.STATUS.ENABLED;

  it('should read default folder', () => {
    musicFileHandler.init('./test/services/music-file/resources/music-folder', false);
    assert.equal(musicFileHandler.playlistFiles.length, 1);
  });
});
