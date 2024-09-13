const { expect } = require('chai');
const EventEmitter = require('events');
const db = require('../../../models');
const MessageHandler = require('../../../lib/message');

describe('message.purge', () => {
  const eventEmitter = new EventEmitter();
  const messageHandler = new MessageHandler(eventEmitter);
  it('should purge messages', async () => {
    await db.Message.truncate();
    await db.Message.create({
      id: '2e3dccb0-fe8e-4e26-96c7-13041a1a3852',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      file: null,
      text: 'This is an old message',
      is_read: true,
      created_at: new Date('2019-02-12T07:49:07.556Z'),
    });
    await db.Message.create({
      id: 'b9a395df-d1d6-4905-a29f-2f110e028ea5',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      file: null,
      text: 'this is a recent message',
      is_read: true,
      created_at: new Date(),
    });
    await messageHandler.purge();
    const rows = await db.Message.findAll({
      attributes: ['id', 'text'],
      raw: true,
    });
    expect(rows).to.deep.equal([
      {
        id: 'b9a395df-d1d6-4905-a29f-2f110e028ea5',
        text: 'this is a recent message',
      },
    ]);
  });
});
