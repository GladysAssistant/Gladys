const { assert, fake } = require('sinon');
const Notification = require('../../../lib/notification');

describe('notification.send', () => {
  it('should send ntfy message', async () => {
    let send;
    const service = {
      getService: () => {
        send = fake.resolves(true);
        return {
          notification: {
            send,
          },
        };
      },
    };
    const notification = new Notification(service);
    await notification.send('test-topic', 'coucou');
    assert.calledOnce(send);
  });
});
