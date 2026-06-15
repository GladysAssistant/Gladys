const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const { getPreviousQuestionsForUser } = proxyquire('../../../lib/message/message.getPreviousQuestionsForUser', {
  '../../models': {
    Message: {
      findAll: messageFindAll,
    },
  },
});

describe('message.getPreviousQuestionsForUser', () => {
  beforeEach(() => {
    messageFindAll.resetHistory();
    messageFindAll.resolves([]);
  });

  it('should pair user questions with assistant answers', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'answer two' },
      { sender_id: 'user-1', text: 'question two' },
      { sender_id: null, text: 'answer one' },
      { sender_id: 'user-1', text: 'question one' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'question one', answer: 'answer one' },
      { question: 'question two', answer: 'answer two' },
    ]);
  });

  it('should include orphan assistant messages', async () => {
    messageFindAll.resolves([{ sender_id: null, text: 'proactive message' }]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'proactive message' }]);
  });

  it('should return orphan assistant message before any user question', async () => {
    messageFindAll.resolves([
      { sender_id: 'user-1', text: 'unanswered question' },
      { sender_id: null, text: 'orphan assistant' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'orphan assistant' }]);
  });

  it('should treat assistant reply as orphan when user question text is empty', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'assistant reply' },
      { sender_id: 'user-1', text: '' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: 'assistant reply' }]);
  });

  it('should fetch only the last four messages', async () => {
    messageFindAll.resolves([]);

    await getPreviousQuestionsForUser('user-1');

    assert.calledOnce(messageFindAll);
    expect(messageFindAll.firstCall.args[0].limit).to.equal(4);
  });
});
