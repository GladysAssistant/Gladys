const sinon = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const Speaker = require('../../../../lib/speaker');
const { EVENTS } = require('../../../../utils/constants');

const { fake, assert } = sinon;

const defaultOutputName = 'default';

const soundRequestPlay = {
  eventType: EVENTS.MUSIC.PLAY,
  provider: 'test-provider',
  providerType: 'URL',
  playlist: [],
  path: 'fake-path',
};

const event = new EventEmitter();

describe('speaker.checkStreamControl', () => {
  it('should check stream control with remove needed because event type random', async () => {
    const speaker = new Speaker(event);
    speaker.removeStreamControl = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      reader: { finished: true },
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const result = await speaker.checkStreamControl(EVENTS.MUSIC.RANDOM, defaultOutputName);

    expect(result).to.be.undefined; // eslint-disable-line
    assert.calledOnceWithExactly(speaker.removeStreamControl, defaultOutputName);
  });

  it('should check stream control with remove needed because reader is finished', async () => {
    const speaker = new Speaker(event);
    speaker.removeStreamControl = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      reader: { finished: false },
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const result = await speaker.checkStreamControl(EVENTS.MUSIC.PAUSE, defaultOutputName);

    expect(result).to.be.undefined; // eslint-disable-line
    assert.calledOnceWithExactly(speaker.removeStreamControl, defaultOutputName);
  });

  it('should check stream control without action', async () => {
    const speaker = new Speaker(event);
    speaker.removeStreamControl = fake.returns(null);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      reader: { finished: true },
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    const result = await speaker.checkStreamControl(EVENTS.MUSIC.PAUSE, defaultOutputName);

    expect(result).to.be.equal(streamControl);
    assert.notCalled(speaker.removeStreamControl);
  });
});
