const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const {
  getPreviousQuestionsForUser,
  buildExchangesFromMessages,
  exchangesToApiMessages,
  isChatHistoryMessage,
  isUnverifiedActionConfirmation,
  resolveAnswerForAiContext,
  FETCH_MESSAGE_LIMIT,
  EXCHANGE_LIMIT,
} = proxyquire('../../../lib/message/message.getPreviousQuestionsForUser', {
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

  it('should keep general conversation answers without tool calls', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'Comptez 6 minutes pour un œuf mollet.', message_type: 'chat' },
      { sender_id: 'user-1', text: 'Donne-moi le temps de cuisson d’un œuf mollet', message_type: 'chat' },
      { sender_id: null, text: 'answer two', message_type: 'chat' },
      { sender_id: 'user-1', text: 'question two', message_type: 'chat' },
      { sender_id: null, text: 'answer one', message_type: 'chat' },
      { sender_id: 'user-1', text: 'question one', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'question one', answer: 'answer one' },
      { question: 'question two', answer: 'answer two' },
      { question: 'Donne-moi le temps de cuisson d’un œuf mollet', answer: 'Comptez 6 minutes pour un œuf mollet.' },
    ]);
  });

  it('should omit unverified action confirmations when no tool was called', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: "J'ai fermé les volets roulants pour vous.", message_type: 'chat' },
      { sender_id: 'user-1', text: 'Ferme les volets', message_type: 'chat' },
      { sender_id: null, text: "J'ai ouvert les volets roulants pour vous.", message_type: 'chat' },
      { sender_id: 'user-1', text: 'Ouvre mes volets', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'Ouvre mes volets', answer: null },
      { question: 'Ferme les volets', answer: null },
    ]);
  });

  it('should keep assistant answers when tools were called', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: "Le volet du bureau est en train de s'ouvrir.", message_type: 'chat' },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"open","device":"Volet_34"})',
        message_type: 'tool_call',
      },
      { sender_id: 'user-1', text: 'Ouvre le volet du bureau', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'Ouvre le volet du bureau', answer: "Le volet du bureau est en train de s'ouvrir." },
    ]);
  });

  it('should ignore proactive notification messages', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'Bonjour ! Voici votre résumé hebdomadaire.', message_type: 'notification' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([]);
  });

  it('should ignore proactive chat messages without a user question', async () => {
    messageFindAll.resolves([{ sender_id: null, text: 'proactive message', message_type: 'chat' }]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([]);
  });

  it('should skip user questions with empty text', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'assistant reply', message_type: 'chat' },
      { sender_id: 'user-1', text: '', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([]);
  });

  it('should fetch enough recent messages to rebuild chat history after filtering tool calls', async () => {
    messageFindAll.resolves([]);

    await getPreviousQuestionsForUser('user-1');

    assert.calledOnce(messageFindAll);
    expect(messageFindAll.firstCall.args[0].limit).to.equal(FETCH_MESSAGE_LIMIT);
  });

  it('should exclude tool_call traces from AI context', async () => {
    messageFindAll.resolves([
      { sender_id: null, text: 'Les volets de la maison sont en train de se fermer.', message_type: 'chat' },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"close","device":"Volet_07"})',
        message_type: 'tool_call',
      },
      {
        sender_id: null,
        text: 'device_set_shutter({"action":"close","device":"Volet_7"})',
        message_type: 'tool_call',
      },
      { sender_id: 'user-1', text: 'ferme tous les volets', message_type: 'chat' },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      { question: 'ferme tous les volets', answer: 'Les volets de la maison sont en train de se fermer.' },
    ]);
  });

  it('should convert exchanges to API messages without empty assistant turns', () => {
    expect(
      exchangesToApiMessages([
        { question: 'Ferme les volets', answer: null },
        { question: 'Œuf mollet ?', answer: 'Comptez 6 minutes.' },
      ]),
    ).to.deep.equal([
      { role: 'user', content: 'Ferme les volets' },
      { role: 'user', content: 'Œuf mollet ?' },
      { role: 'assistant', content: 'Comptez 6 minutes.' },
    ]);
  });

  it('should keep only the last four exchanges', async () => {
    const messages = [];
    for (let i = 1; i <= 6; i += 1) {
      messages.unshift({ sender_id: null, text: `answer ${i}`, message_type: 'chat' });
      messages.unshift({ sender_id: 'user-1', text: `question ${i}`, message_type: 'chat' });
    }
    messageFindAll.resolves(messages);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.have.lengthOf(EXCHANGE_LIMIT);
    expect(exchanges.map((exchange) => exchange.question)).to.deep.equal([
      'question 3',
      'question 4',
      'question 5',
      'question 6',
    ]);
  });
});

describe('message.getPreviousQuestionsForUser helpers', () => {
  it('should detect unverified action confirmations', () => {
    expect(isUnverifiedActionConfirmation("J'ai fermé les volets roulants pour vous.")).to.equal(true);
    expect(isUnverifiedActionConfirmation('La lumière du salon a été éteinte.')).to.equal(true);
    expect(isUnverifiedActionConfirmation('Comptez 6 minutes pour un œuf mollet.')).to.equal(false);
    expect(isUnverifiedActionConfirmation(null)).to.equal(false);
    expect(isUnverifiedActionConfirmation(undefined)).to.equal(false);
    expect(resolveAnswerForAiContext('Comptez 6 minutes.', false)).to.equal('Comptez 6 minutes.');
    expect(resolveAnswerForAiContext("J'ai fermé les volets.", false)).to.equal(null);
    expect(resolveAnswerForAiContext("J'ai fermé les volets.", true)).to.equal("J'ai fermé les volets.");
    expect(resolveAnswerForAiContext(null, false)).to.equal(null);
  });

  it('should identify which stored messages belong in AI chat history', () => {
    expect(isChatHistoryMessage({ message_type: 'chat' })).to.equal(true);
    expect(isChatHistoryMessage({ message_type: 'tool_call' })).to.equal(false);
    expect(isChatHistoryMessage({ message_type: 'notification' })).to.equal(false);
  });

  it('should skip null exchanges when converting to API messages', () => {
    expect(exchangesToApiMessages([null, { question: 'Hi', answer: null }])).to.deep.equal([
      { role: 'user', content: 'Hi' },
    ]);
    expect(exchangesToApiMessages(null)).to.deep.equal([]);
  });

  it('should build exchanges from an in-memory message list', () => {
    expect(
      buildExchangesFromMessages([
        { sender_id: null, text: 'Weekly digest', message_type: 'notification' },
        { sender_id: null, text: "J'ai fermé les volets", message_type: 'chat' },
        { sender_id: 'user-1', text: 'Ferme mes volets', message_type: 'chat' },
      ]),
    ).to.deep.equal([{ question: 'Ferme mes volets', answer: null }]);
  });

  it('should keep only the first assistant chat reply when several follow a user message', () => {
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: 'question', message_type: 'chat' },
        { sender_id: null, text: 'first answer', message_type: 'chat' },
        { sender_id: null, text: 'second answer', message_type: 'chat' },
      ]),
    ).to.deep.equal([{ question: 'question', answer: 'first answer' }]);
  });

  it('should skip exchanges without a user question when converting to API messages', () => {
    expect(exchangesToApiMessages([{ question: null, answer: 'Bonjour' }])).to.deep.equal([
      { role: 'assistant', content: 'Bonjour' },
    ]);
  });
});
