const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const MusicFileHandler = require('../../../../services/music-file/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { MUSICFILE } = require('../../../../services/music-file/lib/utils/musicFile.constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('Music File handler previous', () => {
  it('should build previous music query', async () => {
    const musicFileHandler = new MusicFileHandler(gladys);
    const playlist = await musicFileHandler.parsePlaylist(
      './test/services/music-file/resources/music-folder/file_example_MP3_700KB.m3u',
    );

    musicFileHandler.musicQueryBySpeakerOutputName.set('default', {
      eventType: EVENTS.MUSIC.PLAY,
      speakerOutputName: 'default',
      provider: MUSICFILE.SERVICE_NAME,
      providerType: MUSICFILE.PROVIDER_TYPE,
      path: '/test/path',
      currentPlaylistIndex: 1,
      volumeLevel: 0.8,
      playlist,
    });

    await musicFileHandler.previous('default');

    const newQuery = musicFileHandler.musicQueryBySpeakerOutputName.get('default');

    expect(newQuery.currentPlaylistIndex).to.eq(0);
    assert.calledWithExactly(gladys.event.emit, WEBSOCKET_MESSAGE_TYPES.MUSIC.PLAY, newQuery);
  });
});
