const { assert } = require('chai');

const MusicFileHandler = require('../../../../services/music-file/lib');
const { MUSIC } = require('../../../../utils/constants');

describe('Music File handler getCapabilities', () => {
  const musicFileHandler = new MusicFileHandler({});

  it('should return capabilities of music file provider', () => {
    const capabilities = musicFileHandler.getCapabilities();
    assert.equal(capabilities.previous, MUSIC.PROVIDER.STATUS.ENABLED);
    assert.equal(capabilities.next, MUSIC.PROVIDER.STATUS.ENABLED);
    assert.equal(capabilities.random, MUSIC.PROVIDER.STATUS.ENABLED);
  });
});
