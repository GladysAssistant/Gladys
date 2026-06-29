const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const { getPreviousQuestionsForUser, FETCH_MESSAGE_LIMIT } = proxyquire(
  '../../../lib/message/message.getPreviousQuestionsForUser',
  {
    '../../models': {
      Message: {
        findAll: messageFindAll,
      },
    },
  },
);

describe('message.getPreviousQuestionsForUser', () => {
  beforeEach(() => {
    messageFindAll.resetHistory();
    messageFindAll.resolves([]);
  });

  it('should pair user questions with assistant answers', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'answer two', message_type: 'chat' },
      { sender_id: 'user-1', text: 'question two', message_type: 'chat' },
      { sender_id: null, text: 'answer one', message_type: 'chat' },
      { sender_id: 'user-1', text: 'question one', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'question one', answer: 'answer one' },
      { question: 'question two', answer: 'answer two' },
    ]);
  });

  it('should include orphan assistant messages', async () => {
    messageFindAll.resolves([{ sender_id: null, text: 'proactive message', message_type: 'chat' }]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'proactive message' }]);
  });

  it('should return orphan assistant message before any user question', async () => {
    messageFindAll.resolves([
      { sender_id: 'user-1', text: 'unanswered question', message_type: 'chat' },
      { sender_id: null, text: 'orphan assistant', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'orphan assistant' }]);
  });

  it('should treat assistant reply as orphan when user question text is empty', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'assistant reply', message_type: 'chat' },
      { sender_id: 'user-1', text: '', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'assistant reply' }]);
  });

  it('should fetch enough recent messages to rebuild chat history after filtering tool calls', async () => {
    messageFindAll.resolves([]);

    await getPreviousQuestionsForUser('user-1');

    assert.calledOnce(messageFindAll);
    expect(messageFindAll.firstCall.args[0].limit).to.equal(FETCH_MESSAGE_LIMIT);
  });

  it('should exclude tool_call traces from AI context', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: "Le volet du bureau est en train de s'ouvrir.", message_type: 'chat' },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"open","device":"Volet_34"})',
        message_type: 'tool_call',
      },
      { sender_id: 'user-1', text: 'Ouvre le volet du bureau', message_type: 'chat' },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"close","device":"Volet_7"})',
        message_type: 'tool_call',
      },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"close","device":"Volet_07"})',
        message_type: 'tool_call',
      },
      { sender_id: null, text: 'Les volets de la maison sont en train de se fermer.', message_type: 'chat' },
      { sender_id: 'user-1', text: 'ferme tous les volets', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'ferme tous les volets', answer: 'Les volets de la maison sont en train de se fermer.' },
      { question: 'Ouvre le volet du bureau', answer: "Le volet du bureau est en train de s'ouvrir." },
    ]);
  });
});
