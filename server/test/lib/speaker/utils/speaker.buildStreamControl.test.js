const { expect } = require('chai');
const EventEmitter = require('events');
const Speaker = require('../../../../lib/speaker');
const { EVENTS } = require('../../../../utils/constants');

const soundRequestPlay = {
  eventType: EVENTS.MUSIC.PLAY,
  provider: 'test-provider',
  providerType: 'URL',
  playlist: [],
  path: 'fake-path',
};

const event = new EventEmitter();

describe('speaker.buildStreamControl', () => {
  it('should build stream control without volumeLevel', async () => {
    const speaker = new Speaker(event);

    const streamControl = await speaker.buildStreamControl(soundRequestPlay);

    expect(streamControl.volumeLevel).to.be.equal(0.8);
    expect(streamControl.previousVolumeLevel).to.be.equal(0.8);
    expect(streamControl.soundRequest).to.be.equal(soundRequestPlay);
  });

  it('should build stream control with volumeLevel', async () => {
    const speaker = new Speaker(event);
    soundRequestPlay.volumeLevel = 0.5;

    const streamControl = await speaker.buildStreamControl(soundRequestPlay);

    expect(streamControl.volumeLevel).to.be.equal(0.5);
    expect(streamControl.previousVolumeLevel).to.be.equal(0.5);
    expect(streamControl.soundRequest).to.be.equal(soundRequestPlay);
  });
});
