const { expect } = require('chai');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');

const classification = { intent: 'light.turnon', entities: [{ hey: 1 }], answer: 'nice' };
const brain = {
  classify: () => Promise.resolve({ classification }),
};
const service = {
  getService: () => null,
};

describe('message.create', () => {
  const eventEmitter = new EventEmitter();
  const messageHandler = new MessageHandler(eventEmitter, brain, service);
  it('should return answer from Gladys', async () => {
    const newMessage = await messageHandler.getReply('Turn on', 'fr');
    expect(newMessage).to.equal('Turning on the light...');
  });
  it('should return what from Gladys', async () => {
    const newMessage = await messageHandler.getReply('KULOKOKOK', 'fr');
    expect(newMessage).to.equal('What ?');
  });
});
