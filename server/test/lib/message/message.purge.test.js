const { expect } = require('chai');
const { Op } = require('sequelize');
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
  it('should keep only the 1000 most recent messages per user', async () => {
    await db.Message.truncate();
    const now = Date.now();
    const firstUserMessages = [];
    for (let i = 0; i < 1005; i += 1) {
      firstUserMessages.push({
        sender_id: i % 2 === 0 ? '0cd30aef-9c4e-4a23-88e3-3547971296e5' : null,
        receiver_id: i % 2 === 0 ? null : '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        text: `message ${i}`,
        is_read: true,
        // message 0 is the most recent one
        created_at: new Date(now - i * 1000),
      });
    }
    await db.Message.bulkCreate(firstUserMessages);
    await db.Message.bulkCreate([
      {
        sender_id: '7a137a56-069e-4996-8816-36558174b727',
        receiver_id: null,
        text: 'second user message',
        is_read: true,
        created_at: new Date(now - 2000 * 1000),
      },
    ]);
    await messageHandler.purge();
    const firstUserRemainingMessages = await db.Message.findAll({
      attributes: ['text'],
      where: {
        [Op.or]: [
          { sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' },
          { receiver_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' },
        ],
      },
      order: [['created_at', 'DESC']],
      raw: true,
    });
    expect(firstUserRemainingMessages).to.have.lengthOf(1000);
    expect(firstUserRemainingMessages[0].text).to.equal('message 0');
    expect(firstUserRemainingMessages[999].text).to.equal('message 999');
    const secondUserRemainingMessages = await db.Message.findAll({
      attributes: ['text'],
      where: { sender_id: '7a137a56-069e-4996-8816-36558174b727' },
      raw: true,
    });
    expect(secondUserRemainingMessages).to.deep.equal([{ text: 'second user message' }]);
  });
});
