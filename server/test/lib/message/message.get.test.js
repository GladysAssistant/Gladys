const { expect } = require('chai');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');

describe('message.get', () => {
  const eventEmitter = new EventEmitter();
  const messageHandler = new MessageHandler(eventEmitter);
  it('should get messages user', async () => {
    const messages = await messageHandler.get('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      take: 1,
    });
    expect(messages).to.deep.equal([
      {
        id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
        sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        receiver_id: null,
        file: null,
        text: 'What time is it ?',
        is_read: true,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
});
