const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const MusicFileHandler = require('../../../services/music-file/lib');
const { SYSTEM_VARIABLE_NAMES, MUSIC } = require('../../../utils/constants');
const { MUSICFILE } = require('../../../services/music-file/lib/utils/musicFile.constants');

const MusicService = proxyquire('../../../services/music-file', {
  './lib': MusicFileHandler,
});

const gladys = {
  variable: {
    getValue: (key) => {
      switch (key) {
        case SYSTEM_VARIABLE_NAMES.GLADYS_MUSIC_SERVICES_ENABLED:
          return '{"radio":"DISABLED","music-file":"ENABLED"}';
        case MUSICFILE.DEFAULT_FOLDER:
          return '/home/pi/music';
        case MUSICFILE.READ_SUBFOLDER:
          return MUSIC.PROVIDER.STATUS.ENABLED;
        default:
          return null;
      }
    },
  },
};

describe('MusicFile Service', () => {
  const musicService = MusicService(gladys, 'faea9c35-983k-44d5-bcc9-2af1de37b8b4');
  musicService.soundHandler.init = fake.returns(null);

  it('should start service', async () => {
    await musicService.start();
    expect(musicService.soundHandler).to.be.instanceOf(MusicFileHandler);
    expect(musicService.soundHandler.readSubDirectory).to.eq('ENABLED');
    expect(musicService.soundHandler.defaultFolder).to.be.equal('/home/pi/music');
    assert.calledOnce(musicService.soundHandler.init);
  });

  it('should stop service', async () => {
    musicService.stop();
  });
});
