const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');
const StateManager = require('../../../lib/state');

describe('message.sendToAdmins', () => {
  it('should send message to admins', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const service = {
      getService: () => null,
    };
    const user = {
      getByRole: fake.resolves([{ selector: 'test-user', language: 'fr' }]),
    };
    const brain = {
      getReply: fake.returns('test message'),
    };
    const messageHandler = new MessageHandler(event, brain, service, stateManager, {}, user);
    messageHandler.sendToUser = fake.resolves(null);
    await messageHandler.sendToAdmins('test.message');
    assert.calledOnce(user.getByRole);
    assert.calledWith(brain.getReply, 'fr', 'test.message');
    // @ts-ignore
    assert.calledWith(messageHandler.sendToUser, 'test-user', 'test message');
  });
});
