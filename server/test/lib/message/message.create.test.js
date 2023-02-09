const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EventEmitter = require('events');
const db = require('../../../models');
const MessageHandler = require('../../../lib/message');

const classification = { intent: 'light.turnon', entities: [{ hey: 1 }], answer: 'nice' };
const brain = {
  classify: () => Promise.resolve({ classification }),
};
const service = {
  getService: () => null,
};

describe('message.create', () => {
  it('should create new message', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const eventEmitter = new EventEmitter();
    const messageHandler = new MessageHandler(eventEmitter, brain, service, {}, variable);
    const newMessage = await messageHandler.create({
      text: 'Turn on the light in the kitchen',
      language: 'en',
      source: 'client-api',
      source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        language: 'en',
      },
      id: '5cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    expect(newMessage).to.have.property('message');
  });
  it('should try to response with OpenAI', async () => {
    const variable = {
      getValue: fake.resolves('true'),
    };
    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };
    const messageHandler = new MessageHandler(event, brain, service, {}, variable);
    const message = {
      text: 'Turn on the light in the kitchen',
      language: 'en',
      source: 'client-api',
      source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        language: 'en',
      },
      id: '5cd30aef-9c4e-4a23-88e3-3547971296e5',
    };
    const newMessage = await messageHandler.create(message);
    expect(newMessage).to.have.property('message');
    assert.calledWith(event.emit, 'message.new-for-open-ai', {
      context: { user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5', language: 'en' } },
      message,
      previousQuestions: [],
    });
  });
  it('should try to response with OpenAI and context', async () => {
    const variable = {
      getValue: fake.resolves('true'),
    };
    const event = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };
    await db.Message.create({
      text: 'Question 1',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      is_read: true,
      created_at: new Date('2023-02-09T09:55:05.766Z'),
    });
    await db.Message.create({
      text: 'Answer 1',
      sender_id: null,
      receiver_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      is_read: true,
      created_at: new Date('2023-02-09T09:56:05.766Z'),
    });
    await db.Message.create({
      text: 'Question 2',
      sender_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      receiver_id: null,
      is_read: true,
      created_at: new Date('2023-02-09T09:57:05.766Z'),
    });
    await db.Message.create({
      text: 'Answer 2',
      sender_id: null,
      receiver_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      is_read: true,
      created_at: new Date('2023-02-09T09:58:05.766Z'),
    });
    const messageHandler = new MessageHandler(event, brain, service, {}, variable);
    const message = {
      text: 'Turn on the light in the kitchen',
      language: 'en',
      source: 'client-api',
      source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        language: 'en',
      },
      id: '5cd30aef-9c4e-4a23-88e3-3547971296e5',
    };
    const newMessage = await messageHandler.create(message);
    expect(newMessage).to.have.property('message');
    assert.calledOnce(event.emit);
    expect(event.emit.getCall(0).args[0]).to.equal('message.new-for-open-ai');
    expect(event.emit.getCall(0).args[1]).to.deep.equal({
      context: {
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      message,
      previousQuestions: [{ answer: 'Answer 2', question: 'Question 2' }],
    });
  });
});
