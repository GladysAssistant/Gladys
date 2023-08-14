const sinon = require('sinon');
const { expect } = require('chai');
const { PassThrough } = require('stream');
const EventEmitter = require('events');
const SpeakerStream = require('@euguuu/speaker');
const Speaker = require('../../../../lib/speaker');
const { EVENTS } = require('../../../../utils/constants');

const { fake, assert } = sinon;

const soundRequestPlay = {
  eventType: EVENTS.MUSIC.PLAY,
  provider: 'test-provider',
  providerType: 'URL',
  playlist: [],
  path: 'fake-path',
};

const soundHandler = {
  getReadStream: fake.returns(new PassThrough()),
};

const event = new EventEmitter();

describe('speaker.buildSpeakerStream', () => {
  it('should build speaker stream and check finish event with play next', async () => {
    const speaker = new Speaker(event);
    speaker.play = fake.returns(null);
    soundHandler.buildPlayQuery = fake.returns({ path: 'test' });

    const speakerStream = await speaker.buildSpeakerStream(soundRequestPlay, soundHandler);

    expect(speakerStream).to.be.an.instanceof(SpeakerStream);
    expect(speakerStream.channels).to.be.equal(2);
    expect(speakerStream.bitDepth).to.be.equal(16);
    expect(speakerStream.sampleRate).to.be.equal(44100);
    expect(speakerStream._events.finish).to.not.be.null; // eslint-disable-line

    await speakerStream.end();

    setTimeout(() => {
      assert.calledOnce(speaker.play);
    });
  });

  it('should build speaker stream and check finish event with stop', async () => {
    const speaker = new Speaker(event);
    speaker.removeStreamControl = fake.returns(null);
    soundHandler.buildPlayQuery = fake.returns({});

    const speakerStream = await speaker.buildSpeakerStream(soundRequestPlay, soundHandler);

    expect(speakerStream).to.be.an.instanceof(SpeakerStream);

    await speakerStream.end();

    setTimeout(() => {
      assert.calledOnce(speaker.removeStreamControl);
    });
  });
});
