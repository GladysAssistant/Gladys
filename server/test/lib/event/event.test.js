const { expect } = require('chai');
const Event = require('../../../lib/event');

describe('event', () => {
  it('should verify that event is asynchronous', async () => {
    const eventEmitter = new Event();
    let alreadySeen = false;
    eventEmitter.on('test', () => {
      alreadySeen = true;
    });
    for (let i = 0; i < 10; i += 1) {
      eventEmitter.emit('test');
    }
    // if the function call is synchronous, it'll be true
    // because the event emitter will be called before
    expect(alreadySeen).to.equal(false);
  });

  it('should verify that event listener is removed', async () => {
    const eventEmitter = new Event();
    expect(eventEmitter.listenerCount('test-remove')).to.equal(0);

    const cb = () => {};

    eventEmitter.on('test-remove', cb);
    expect(eventEmitter.listenerCount('test-remove')).to.equal(1);

    eventEmitter.removeListener('test-remove', cb);
    expect(eventEmitter.listenerCount('test-remove')).to.equal(0);
  });
});
