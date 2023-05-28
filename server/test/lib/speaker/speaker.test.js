const sinon = require('sinon');
const { expect } = require('chai');
const { PassThrough } = require('stream');
const Volume = require('pcm-volume');
const EventEmitter = require('events');
const Speaker = require('../../../lib/speaker');
const { EVENTS } = require('../../../utils/constants');

const { fake, assert } = sinon;

const defaultOutputName = 'default';

const soundRequestPlay = {
  eventType: EVENTS.MUSIC.PLAY,
  provider: 'test-provider',
  providerType: 'URL',
  playlist: [],
  path: 'fake-path',
};

const soundHandler = {
  getReadStream: fake.returns(new PassThrough()),
  buildPlayQuery: () => ({}),
};

const service = {
  getService: fake.returns({
    soundHandler,
  }),
};

const event = new EventEmitter();

describe('speaker.play', () => {
  it('should play sound request', async () => {
    const speaker = new Speaker(event, service);
    speaker.checkStreamControl = fake.returns(null);
    speaker.buildStreamControl = fake.returns({
      volumeLevel: 0.8,
    });
    speaker.buildSpeakerStream = fake.returns(new PassThrough());

    await speaker.play(soundRequestPlay);

    assert.calledOnceWithExactly(speaker.checkStreamControl, EVENTS.MUSIC.PLAY, defaultOutputName);
    assert.calledOnceWithExactly(speaker.buildStreamControl, soundRequestPlay);
    assert.calledOnceWithExactly(service.getService, 'test-provider');
    assert.calledOnceWithExactly(speaker.buildSpeakerStream, soundRequestPlay, soundHandler, defaultOutputName);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(1);
    expect(mapOfStreamControl.get(defaultOutputName).volumeLevel).to.be.equal(0.8);
    expect(mapOfStreamControl.get(defaultOutputName).reader).to.be.instanceOf(PassThrough);
    expect(mapOfStreamControl.get(defaultOutputName).writer).to.be.instanceOf(PassThrough);
    expect(mapOfStreamControl.get(defaultOutputName).volume).to.be.instanceOf(Volume);
  });

  it('should not play sound request', async () => {
    const speaker = new Speaker(event, service);
    speaker.buildSpeakerStream = fake.throws(null);

    await speaker.play(soundRequestPlay);
    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);
  });
});

describe('speaker.pause', () => {
  it('should pause sound request', async () => {
    const speaker = new Speaker(event, service);

    const streamWriter = new PassThrough();
    streamWriter.cork = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      writer: streamWriter,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestPause = {
      eventType: EVENTS.MUSIC.PAUSE,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.pause(soundRequestPause);

    assert.calledOnce(streamWriter.cork);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(1);
    expect(mapOfStreamControl.get(defaultOutputName).volumeLevel).to.be.equal(0.8);
    expect(mapOfStreamControl.get(defaultOutputName).soundRequest.eventType).to.be.equal(EVENTS.MUSIC.PAUSE);
    expect(mapOfStreamControl.get(defaultOutputName).soundRequest.pauseTimestamp).to.not.be.null; // eslint-disable-line
  });

  it('should not pause sound request', async () => {
    const speaker = new Speaker(event, service);

    const streamWriter = new PassThrough();
    streamWriter.cork = fake.throws(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      writer: streamWriter,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    await speaker.pause(soundRequestPlay);
    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);
  });
});

describe('speaker.stop', () => {
  it('should stop sound request', async () => {
    const speaker = new Speaker(event, service);

    const streamWriter = new PassThrough();

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      writer: streamWriter,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestPause = {
      eventType: EVENTS.MUSIC.STOP,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.stop(soundRequestPause);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);
  });
});

describe('speaker.mute', () => {
  it('should mute sound request', async () => {
    const speaker = new Speaker(event, service);

    const volumeStream = new PassThrough();
    volumeStream.setVolume = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      volume: volumeStream,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestMute = {
      eventType: EVENTS.MUSIC.MUTE,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.mute(soundRequestMute);

    assert.calledOnceWithExactly(volumeStream.setVolume, 0);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(1);
    expect(mapOfStreamControl.get(defaultOutputName).volumeLevel).to.be.equal(0);
    expect(mapOfStreamControl.get(defaultOutputName).previousVolumeLevel).to.be.equal(0.8);
  });

  it('should unmute sound request', async () => {
    const speaker = new Speaker(event, service);

    const volumeStream = new PassThrough();
    volumeStream.setVolume = fake.returns(null);

    const streamControl = {
      volumeLevel: 0,
      previousVolumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      volume: volumeStream,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestMute = {
      eventType: EVENTS.MUSIC.MUTE,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.mute(soundRequestMute);

    assert.calledOnceWithExactly(volumeStream.setVolume, 0.8);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(1);
    expect(mapOfStreamControl.get(defaultOutputName).volumeLevel).to.be.equal(0.8);
  });

  it('should not mute sound request', async () => {
    const speaker = new Speaker(event, service);

    const volumeStream = new PassThrough();
    volumeStream.setVolume = fake.throws(null);

    const streamControl = {
      volumeLevel: 0,
      previousVolumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      volume: volumeStream,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestMute = {
      eventType: EVENTS.MUSIC.MUTE,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.mute(soundRequestMute);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);
  });
});

describe('speaker.volume', () => {
  it('should set volume sound request', async () => {
    const speaker = new Speaker(event, service);

    const volumeStream = new PassThrough();
    volumeStream.setVolume = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.5,
      soundRequest: soundRequestPlay,
      volume: volumeStream,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestVolume = {
      eventType: EVENTS.MUSIC.VOLUME,
      speakerOutputName: defaultOutputName,
      volumeLevel: 0.8,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.volume(soundRequestVolume);

    assert.calledOnceWithExactly(volumeStream.setVolume, 0.8);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(1);
    expect(mapOfStreamControl.get(defaultOutputName).volumeLevel).to.be.equal(0.8);
  });

  it('should not set volume sound request', async () => {
    const speaker = new Speaker(event, service);

    const volumeStream = new PassThrough();
    volumeStream.setVolume = fake.throws(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      volume: volumeStream,
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const soundRequestVolume = {
      eventType: EVENTS.MUSIC.VOLUME,
      speakerOutputName: defaultOutputName,
      provider: 'test-provider',
      providerType: 'URL',
      playlist: [],
      path: 'fake-path',
    };

    await speaker.volume(soundRequestVolume);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);
  });
});
