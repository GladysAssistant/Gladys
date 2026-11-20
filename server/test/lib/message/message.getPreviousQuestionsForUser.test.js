const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const messageFindAll = sinon.stub().resolves([]);

const {
  getPreviousQuestionsForUser,
  buildExchangesFromMessages,
  limitExchanges,
  exchangesToApiMessages,
  buildChatApiMessages,
  isChatHistoryMessage,
  isWithinAiTurnGap,
  isPartOfAiTurn,
  isUnverifiedActionConfirmation,
  resolveAnswerForAiContext,
  formatSceneMessage,
  stripSceneMessagePrefix,
  FETCH_MESSAGE_LIMIT,
  MAX_FETCH_BATCHES,
  EXCHANGE_LIMIT,
  SCENE_MESSAGE_LIMIT,
  MAX_SCENE_MESSAGE_CHARS,
  AI_TURN_MAX_GAP_MS,
  SCENE_MESSAGE_PREFIX,
} = proxyquire('../../../lib/message/message.getPreviousQuestionsForUser', {
  '../../models': {
    Message: {
      findAll: messageFindAll,
    },
  },
});

describe('message.getPreviousQuestionsForUser', () => {
  beforeEach(() => {
    messageFindAll.reset();
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

  it('should keep a chat message sent by a scene without a user question', async () => {
    messageFindAll.resolves([{ sender_id: null, text: 'Faut-il éteindre le sèche-linge ?', message_type: 'chat' }]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([{ question: null, answer: '[Scene message] Faut-il éteindre le sèche-linge ?' }]);
  });

  it('should keep the messages sent by scenes after the answer, so a reply to a scene is understood', async () => {
    // https://github.com/GladysAssistant/Gladys/issues/3424, newest first like the database query
    messageFindAll.resolves([
      {
        sender_id: null,
        text: 'Faut-il éteindre le sèche-linge ?',
        message_type: 'chat',
        created_at: new Date('2026-11-20T08:03:00.000Z'),
      },
      {
        sender_id: null,
        text: 'Le cycle de séchage est terminé.',
        message_type: 'chat',
        created_at: new Date('2026-11-20T08:02:59.000Z'),
      },
      {
        sender_id: null,
        text: 'Faut-il éteindre la machine à laver ?',
        message_type: 'chat',
        created_at: new Date('2026-11-20T06:00:01.000Z'),
      },
      {
        sender_id: null,
        text: 'Le cycle de lavage est terminé.',
        message_type: 'chat',
        created_at: new Date('2026-11-20T06:00:00.000Z'),
      },
      {
        sender_id: null,
        text: 'Weekly digest',
        message_type: 'notification',
        created_at: new Date('2026-11-20T05:00:00.000Z'),
      },
      {
        sender_id: null,
        text: 'Les deux scènes ont été créées avec succès.',
        message_type: 'chat',
        created_at: new Date('2026-11-19T18:00:40.000Z'),
      },
      {
        sender_id: null,
        text: 'scene_create({"name":"Présence Noam"})',
        message_type: 'tool_call',
        created_at: new Date('2026-11-19T18:00:30.000Z'),
      },
      {
        sender_id: null,
        text: 'scene_create({"name":"Présence Livine"})',
        message_type: 'tool_call',
        created_at: new Date('2026-11-19T18:00:20.000Z'),
      },
      {
        sender_id: 'user-1',
        text: 'Peux-tu refaire la scène pour Livine et pour Noam ?',
        message_type: 'chat',
        created_at: new Date('2026-11-19T18:00:00.000Z'),
      },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges).to.deep.equal([
      {
        question: 'Peux-tu refaire la scène pour Livine et pour Noam ?',
        answer: 'Les deux scènes ont été créées avec succès.',
      },
      { question: null, answer: '[Scene message] Le cycle de lavage est terminé.' },
      { question: null, answer: '[Scene message] Faut-il éteindre la machine à laver ?' },
      { question: null, answer: '[Scene message] Le cycle de séchage est terminé.' },
      { question: null, answer: '[Scene message] Faut-il éteindre le sèche-linge ?' },
    ]);
    // one assistant message: some chat templates require the roles to alternate
    expect(exchangesToApiMessages(exchanges)).to.deep.equal([
      { role: 'user', content: 'Peux-tu refaire la scène pour Livine et pour Noam ?' },
      {
        role: 'assistant',
        content: [
          'Les deux scènes ont été créées avec succès.',
          '[Scene message] Le cycle de lavage est terminé.',
          '[Scene message] Faut-il éteindre la machine à laver ?',
          '[Scene message] Le cycle de séchage est terminé.',
          '[Scene message] Faut-il éteindre le sèche-linge ?',
        ].join('\n\n'),
      },
    ]);
  });

  it('should not let messages sent by scenes push user exchanges out of the window', async () => {
    const messages = [];
    for (let i = 1; i <= 5; i += 1) {
      messages.unshift({
        sender_id: 'user-1',
        text: `question ${i}`,
        message_type: 'chat',
        created_at: new Date(`2026-11-20T0${i}:00:00.000Z`),
      });
      messages.unshift({
        sender_id: null,
        text: `answer ${i}`,
        message_type: 'chat',
        created_at: new Date(`2026-11-20T0${i}:00:10.000Z`),
      });
      messages.unshift({
        sender_id: null,
        text: `scene ${i}`,
        message_type: 'chat',
        created_at: new Date(`2026-11-20T0${i}:30:00.000Z`),
      });
    }
    messageFindAll.resolves(messages);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    expect(exchanges.filter((exchange) => exchange.question !== null)).to.have.lengthOf(EXCHANGE_LIMIT);
    expect(exchanges).to.deep.equal([
      { question: 'question 2', answer: 'answer 2' },
      { question: null, answer: '[Scene message] scene 2' },
      { question: 'question 3', answer: 'answer 3' },
      { question: null, answer: '[Scene message] scene 3' },
      { question: 'question 4', answer: 'answer 4' },
      { question: null, answer: '[Scene message] scene 4' },
      { question: 'question 5', answer: 'answer 5' },
      { question: null, answer: '[Scene message] scene 5' },
    ]);
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
    expect(messageFindAll.firstCall.args[0].offset).to.equal(0);
    expect(messageFindAll.firstCall.args[0].attributes).to.include('created_at');
  });

  it('should fetch older messages when the recent ones hold too few user messages', async () => {
    const sceneMessages = [];
    for (let i = 0; i < FETCH_MESSAGE_LIMIT; i += 1) {
      sceneMessages.push({
        sender_id: null,
        text: `scene ${FETCH_MESSAGE_LIMIT - i}`,
        message_type: 'chat',
        created_at: new Date(Date.UTC(2026, 10, 20, 12, FETCH_MESSAGE_LIMIT - i)),
      });
    }
    messageFindAll.onFirstCall().resolves(sceneMessages);
    messageFindAll.onSecondCall().resolves([
      { sender_id: null, text: 'answer', message_type: 'chat', created_at: new Date('2026-11-20T08:00:10.000Z') },
      { sender_id: 'user-1', text: 'question', message_type: 'chat', created_at: new Date('2026-11-20T08:00:00.000Z') },
    ]);

    const exchanges = await getPreviousQuestionsForUser('user-1');

    assert.calledTwice(messageFindAll);
    expect(messageFindAll.secondCall.args[0].offset).to.equal(FETCH_MESSAGE_LIMIT);
    expect(exchanges[0]).to.deep.equal({ question: 'question', answer: 'answer' });
    expect(exchanges.slice(1).map((exchange) => exchange.answer)).to.deep.equal(
      sceneMessages
        .slice(0, SCENE_MESSAGE_LIMIT)
        .reverse()
        .map((message) => `[Scene message] ${message.text}`),
    );
  });

  it('should stop fetching once the messages hold enough user messages, or after the last batch', async () => {
    const fullBatchWithUserMessages = [];
    for (let i = 0; i < FETCH_MESSAGE_LIMIT; i += 1) {
      fullBatchWithUserMessages.push({ sender_id: i % 2 === 0 ? 'user-1' : null, text: `message ${i}`, message_type: 'chat' });
    }
    messageFindAll.resolves(fullBatchWithUserMessages);
    await getPreviousQuestionsForUser('user-1');
    assert.calledOnce(messageFindAll);

    messageFindAll.resetHistory();
    const fullBatchOfNotifications = Array.from({ length: FETCH_MESSAGE_LIMIT }, () => ({
      sender_id: null,
      text: 'Weekly digest',
      message_type: 'notification',
    }));
    messageFindAll.resolves(fullBatchOfNotifications);
    const exchanges = await getPreviousQuestionsForUser('user-1');
    expect(messageFindAll.callCount).to.equal(MAX_FETCH_BATCHES);
    expect(exchanges).to.deep.equal([]);
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
        { sender_id: 'user-1', text: 'Ferme mes volets', message_type: 'chat' },
        { sender_id: null, text: "J'ai fermé les volets", message_type: 'chat' },
        { sender_id: null, text: 'Weekly digest', message_type: 'notification' },
      ]),
    ).to.deep.equal([{ question: 'Ferme mes volets', answer: null }]);
  });

  it('should join the replies of an AI turn with tool calls', () => {
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: 'Montre-moi le jardin', message_type: 'chat' },
        { sender_id: null, text: 'camera_get_image({"camera":"Jardin"})', message_type: 'tool_call' },
        { sender_id: null, text: "Voici l'image de la caméra.", message_type: 'chat' },
        { sender_id: null, text: '', message_type: 'chat' },
        { sender_id: null, text: 'On voit une voiture devant le garage.', message_type: 'chat' },
      ]),
    ).to.deep.equal([
      {
        question: 'Montre-moi le jardin',
        answer: "Voici l'image de la caméra.\n\nOn voit une voiture devant le garage.",
      },
    ]);
  });

  it('should end an AI turn without tool call at its only reply, whatever comes next', () => {
    // the AI answers without any tool, then a scene writes a few minutes later: the scene message must
    // neither be merged into the answer nor dropped by the unverified-action guard
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: 'Bonjour', message_type: 'chat', created_at: '2026-11-20T08:00:00.000Z' },
        { sender_id: null, text: 'Bonjour !', message_type: 'chat', created_at: '2026-11-20T08:00:05.000Z' },
        {
          sender_id: null,
          text: 'La porte du garage a été ouverte il y a 10 min. Faut-il la fermer ?',
          message_type: 'chat',
          created_at: '2026-11-20T08:03:00.000Z',
        },
        // an "ask the AI" scene action: its tool calls do not belong to the user message above
        {
          sender_id: null,
          text: 'device_turn_on_off({"device":"Lampe"})',
          message_type: 'tool_call',
          created_at: '2026-11-20T08:03:30.000Z',
        },
        { sender_id: null, text: 'La lampe a été allumée.', message_type: 'chat', created_at: '2026-11-20T08:03:40.000Z' },
        { sender_id: null, text: 'Gladys was upgraded', message_type: 'notification', created_at: '2026-11-20T08:04:00.000Z' },
      ]),
    ).to.deep.equal([
      { question: 'Bonjour', answer: 'Bonjour !' },
      { question: null, answer: '[Scene message] La porte du garage a été ouverte il y a 10 min. Faut-il la fermer ?' },
      { question: null, answer: `${SCENE_MESSAGE_PREFIX} La lampe a été allumée.` },
    ]);
  });

  it('should still omit an unverified action claimed by an AI turn without tool call', () => {
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: 'Ferme les volets', message_type: 'chat', created_at: '2026-11-20T08:00:00.000Z' },
        { sender_id: null, text: "J'ai fermé les volets.", message_type: 'chat', created_at: '2026-11-20T08:00:05.000Z' },
      ]),
    ).to.deep.equal([{ question: 'Ferme les volets', answer: null }]);
  });

  it('should keep a long AI turn with tool calls as long as its messages follow each other closely', () => {
    const start = new Date('2026-11-20T08:00:00.000Z').getTime();
    const at = (delay) => new Date(start + delay);
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: 'Éteins tout', message_type: 'chat', created_at: at(0) },
        { sender_id: null, text: 'device_turn_on_off({})', message_type: 'tool_call', created_at: at(AI_TURN_MAX_GAP_MS) },
        { sender_id: null, text: 'Tout est éteint.', message_type: 'chat', created_at: at(2 * AI_TURN_MAX_GAP_MS) },
        { sender_id: null, text: 'Bonne nuit !', message_type: 'chat', created_at: at(3 * AI_TURN_MAX_GAP_MS + 1) },
      ]),
    ).to.deep.equal([
      { question: 'Éteins tout', answer: 'Tout est éteint.' },
      { question: null, answer: '[Scene message] Bonne nuit !' },
    ]);
  });

  it('should drop the answer to a user message without text but keep the scene messages after it', () => {
    expect(
      buildExchangesFromMessages([
        { sender_id: 'user-1', text: '', message_type: 'chat', created_at: '2026-11-20T08:00:00.000Z' },
        { sender_id: null, text: 'answer', message_type: 'chat', created_at: '2026-11-20T08:00:10.000Z' },
        { sender_id: null, text: 'scene', message_type: 'chat', created_at: '2026-11-20T10:00:00.000Z' },
      ]),
    ).to.deep.equal([{ question: null, answer: '[Scene message] scene' }]);
  });

  it('should keep a Gladys message in the AI turn when a date is missing', () => {
    expect(isWithinAiTurnGap('2026-11-20T08:00:00.000Z', '2026-11-20T08:04:59.000Z')).to.equal(true);
    expect(isWithinAiTurnGap('2026-11-20T08:00:00.000Z', '2026-11-20T08:05:01.000Z')).to.equal(false);
    expect(isWithinAiTurnGap(undefined, '2026-11-20T08:05:01.000Z')).to.equal(true);
    expect(isWithinAiTurnGap('2026-11-20T08:00:00.000Z', undefined)).to.equal(true);
    expect(isWithinAiTurnGap(null, '2026-11-20T08:05:01.000Z')).to.equal(true);
    expect(isWithinAiTurnGap('2026-11-20T08:00:00.000Z', null)).to.equal(true);
    expect(isWithinAiTurnGap('not a date', '2026-11-20T08:05:01.000Z')).to.equal(true);
  });

  it('should tell whether a Gladys message belongs to an AI turn', () => {
    const lastMessageAt = '2026-11-20T08:00:00.000Z';
    const message = { created_at: '2026-11-20T08:01:00.000Z' };
    expect(isPartOfAiTurn({ lastMessageAt, answers: [], hadToolCall: false }, message)).to.equal(true);
    expect(isPartOfAiTurn({ lastMessageAt, answers: ['Bonjour !'], hadToolCall: false }, message)).to.equal(false);
    expect(isPartOfAiTurn({ lastMessageAt, answers: ['Voici'], hadToolCall: true }, message)).to.equal(true);
    expect(
      isPartOfAiTurn({ lastMessageAt, answers: [], hadToolCall: true }, { created_at: '2026-11-20T08:06:00.000Z' }),
    ).to.equal(false);
  });

  it('should truncate long scene messages and strip a copied prefix', () => {
    expect(formatSceneMessage('Lavage terminé.')).to.equal('[Scene message] Lavage terminé.');
    expect(formatSceneMessage('x'.repeat(MAX_SCENE_MESSAGE_CHARS))).to.equal(
      `[Scene message] ${'x'.repeat(MAX_SCENE_MESSAGE_CHARS)}`,
    );
    expect(formatSceneMessage('x'.repeat(MAX_SCENE_MESSAGE_CHARS + 1))).to.equal(
      `[Scene message] ${'x'.repeat(MAX_SCENE_MESSAGE_CHARS)}…`,
    );
    expect(stripSceneMessagePrefix(`${SCENE_MESSAGE_PREFIX} Le sèche-linge est éteint.`)).to.equal(
      'Le sèche-linge est éteint.',
    );
    expect(stripSceneMessagePrefix('[Scene message] [Scene message]  Éteint.')).to.equal('Éteint.');
    expect(stripSceneMessagePrefix('Le [Scene message] reste.')).to.equal('Le [Scene message] reste.');
  });

  it('should count user exchanges only and cap the messages sent by scenes', () => {
    const sceneMessages = [];
    for (let i = 1; i <= SCENE_MESSAGE_LIMIT + 2; i += 1) {
      sceneMessages.push({ question: null, answer: `[Scene message] scene ${i}` });
    }
    expect(
      limitExchanges([
        { question: null, answer: '[Scene message] before the window' },
        { question: 'question 0', answer: 'answer 0' },
        { question: null, answer: '[Scene message] before the oldest kept user exchange' },
        { question: 'question 1', answer: 'answer 1' },
        { question: 'question 2', answer: null },
        { question: 'question 3', answer: 'answer 3' },
        ...sceneMessages,
        { question: 'question 4', answer: 'answer 4' },
      ]),
    ).to.deep.equal([
      { question: 'question 1', answer: 'answer 1' },
      { question: 'question 2', answer: null },
      { question: 'question 3', answer: 'answer 3' },
      ...sceneMessages.slice(-SCENE_MESSAGE_LIMIT),
      { question: 'question 4', answer: 'answer 4' },
    ]);
    // fewer user exchanges than the limit: the scene messages before them are kept too
    expect(
      limitExchanges([
        { question: null, answer: '[Scene message] scene a' },
        { question: 'question', answer: 'answer' },
        { question: null, answer: '[Scene message] scene b' },
      ]),
    ).to.deep.equal([
      { question: null, answer: '[Scene message] scene a' },
      { question: 'question', answer: 'answer' },
      { question: null, answer: '[Scene message] scene b' },
    ]);
    expect(limitExchanges([])).to.deep.equal([]);
    expect(
      limitExchanges(
        [
          { question: 'question 1', answer: 'answer 1' },
          { question: 'question 2', answer: 'answer 2' },
          { question: null, answer: '[Scene message] scene a' },
          { question: null, answer: '[Scene message] scene b' },
        ],
        { exchangeLimit: 1, sceneMessageLimit: 1 },
      ),
    ).to.deep.equal([
      { question: 'question 2', answer: 'answer 2' },
      { question: null, answer: '[Scene message] scene b' },
    ]);
  });

  it('should skip exchanges without a user question when converting to API messages', () => {
    expect(exchangesToApiMessages([{ question: null, answer: 'Bonjour' }])).to.deep.equal([
      { role: 'assistant', content: 'Bonjour' },
    ]);
  });

  it('should merge assistant messages in a row, but not user messages', () => {
    expect(
      exchangesToApiMessages([
        { question: 'Ferme les volets', answer: null },
        { question: 'Quelle heure est-il ?', answer: 'Il est 8 h.' },
        { question: null, answer: '[Scene message] Lavage terminé.' },
        { question: 'Merci', answer: null },
      ]),
    ).to.deep.equal([
      { role: 'user', content: 'Ferme les volets' },
      { role: 'user', content: 'Quelle heure est-il ?' },
      { role: 'assistant', content: 'Il est 8 h.\n\n[Scene message] Lavage terminé.' },
      { role: 'user', content: 'Merci' },
    ]);
  });

  it('should move the scene messages sent before the first user message to the system message', () => {
    expect(
      buildChatApiMessages('System prompt', [
        { question: null, answer: '[Scene message] Lavage terminé.' },
        { question: null, answer: '[Scene message] Faut-il éteindre la machine ?' },
        { question: 'Oui', answer: "C'est éteint." },
      ]),
    ).to.deep.equal([
      {
        role: 'system',
        content: [
          'System prompt',
          '',
          'Messages sent to the user by their scenes before the conversation below:',
          '[Scene message] Lavage terminé.',
          '',
          '[Scene message] Faut-il éteindre la machine ?',
        ].join('\n'),
      },
      { role: 'user', content: 'Oui' },
      { role: 'assistant', content: "C'est éteint." },
    ]);
    expect(buildChatApiMessages('System prompt', [{ question: 'Hi', answer: 'Hello' }])).to.deep.equal([
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
    ]);
    expect(buildChatApiMessages('System prompt', null)).to.deep.equal([{ role: 'system', content: 'System prompt' }]);
  });
});
