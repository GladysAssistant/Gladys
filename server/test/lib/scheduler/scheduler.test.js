const EventEmitter = require('events');
const Scheduler = require('../../../lib/scheduler');

const event = new EventEmitter();

describe('Scheduler', () => {
  const scheduler = new Scheduler(event);
  it('should init scheduler', async () => {
    scheduler.init();
  });
  it('should cancel scheduler', async () => {
    scheduler.cancel();
  });
  it('should run job', async () => {
    scheduler.run({
      name: 'test',
      frequencyInSeconds: 24 * 60 * 60,
      event: 'test-event',
    });
  });
});
