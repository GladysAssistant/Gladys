const { expect } = require('chai');
const Event = require('../../../lib/event');

describe('event', () => {
  const eventEmitter = new Event();
  it('should verify that event is asynchronous', async () => {
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
    let alreadySeen = false;
    const cb = () => {
      alreadySeen = true;
    };

    eventEmitter.on('test', cb);
    eventEmitter.removeListener('test', cb);

    for (let i = 0; i < 10; i += 1) {
      eventEmitter.emit('test');
    }
    // if the function call is synchronous, it'll be true
    // because the event emitter will be called before
    expect(alreadySeen).to.equal(false);
  });
});
