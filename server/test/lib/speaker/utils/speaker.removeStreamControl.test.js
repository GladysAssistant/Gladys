const sinon = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');
const Speaker = require('../../../../lib/speaker');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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
event.emit = fake.returns(null);

describe('speaker.removeStreamControl', () => {
  it('should check stream control with remove needed because event type random', async () => {
    const speaker = new Speaker(event);

    const streamControl = {
      volumeLevel: 0.8,
      soundRequest: soundRequestPlay,
      reader: { end: fake.returns(null) },
      writer: { destroy: fake.returns(null) },
    };
    speaker.mapOfStreamControl.set(defaultOutputName, streamControl);

    await speaker.removeStreamControl(defaultOutputName);

    const { mapOfStreamControl } = speaker;
    expect(mapOfStreamControl.size).to.be.equal(0);

    assert.calledOnce(streamControl.reader.end);
    assert.calledOnce(streamControl.writer.destroy);
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MUSIC.FINISH,
      payload: {},
    });
  });
});
