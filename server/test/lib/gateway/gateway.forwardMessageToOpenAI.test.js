const { fake, assert } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');
const { Error429 } = require('../../../utils/httpErrors');

const sequelize = {
  close: fake.resolves(null),
};

const system = {};

const config = getConfig();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.forwardMessageToOpenAI', () => {
  let gateway;
  let messageManager;
  beforeEach(() => {
    const variable = {
      getValue: fake.resolves(null),
      setValue: fake.resolves(null),
    };
    const scheduler = {};
    messageManager = {
      reply: fake.resolves(null),
      replyByIntent: fake.resolves(null),
    };
    const brain = {
      getEntityIdByName: fake.returns('14a8ad23-78fa-45e4-8583-f5452792818d'),
    };
    const serviceManager = {};
    const stateManager = {};
    gateway = new Gateway(
      variable,
      event,
      system,
      sequelize,
      config,
      {},
      stateManager,
      serviceManager,
      job,
      scheduler,
      messageManager,
      brain,
    );
    gateway.connected = true;
  });

  const previousQuestions = [];
  const message = {
    text: 'Turn on the light in the living room',
  };
  const context = {};
  it('should get info response from OpenAI', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({
      type: 'TURN_ON',
      answer: 'Light are being turned on.',
      room: 'living room',
    });
    const classification = await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    expect(classification).to.deep.equal({
      entities: [
        {
          entity: 'room',
          option: '14a8ad23-78fa-45e4-8583-f5452792818d',
          sourceText: 'living room',
        },
      ],
      intent: 'light.turn-on',
    });
  });
  it('should get info from OpenAI', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({
      type: 'INFO',
      answer: 'Jules Verne is a famous writer.',
      room: null,
    });
    const classification = await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    expect(classification).to.deep.equal({
      intent: 'info.get-info',
    });
  });
  it('should get temperature from OpenAI', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({
      type: 'GET_TEMPERATURE',
      answer: 'Getting the temperature...',
      room: 'living room',
    });
    const classification = await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    expect(classification).to.deep.equal({
      entities: [
        {
          entity: 'room',
          option: '14a8ad23-78fa-45e4-8583-f5452792818d',
          sourceText: 'living room',
        },
      ],
      intent: 'temperature-sensor.get-in-room',
    });
  });
  it('should start scene from OpenAI', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({
      type: 'SCENE_START',
      answer: 'Starting scene..',
      room: null,
      scene: 'woodfire',
    });
    const classification = await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    expect(classification).to.deep.equal({
      entities: [
        {
          entity: 'scene',
          option: '14a8ad23-78fa-45e4-8583-f5452792818d',
          sourceText: 'woodfire',
        },
      ],
      intent: 'scene.start',
    });
  });

  it('should display camera from OpenAI', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.resolves({
      type: 'SHOW_CAMERA',
      answer: 'Voilà ce que je vois:',
      room: null,
      scene: null,
      device: 'camera-1',
    });
    const classification = await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    expect(classification).to.deep.equal({
      entities: [
        {
          entity: 'device',
          option: '14a8ad23-78fa-45e4-8583-f5452792818d',
          sourceText: 'camera-1',
        },
      ],
      intent: 'camera.get-image',
    });
  });

  it('should send too many requests message', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(new Error429());
    await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    assert.calledWith(messageManager.replyByIntent, message, 'openai.request.tooManyRequests', context);
  });
  it('should send unknown error message', async () => {
    gateway.gladysGatewayClient.openAIAsk = fake.rejects(new Error());
    await gateway.forwardMessageToOpenAI({ message, previousQuestions, context });
    assert.calledWith(messageManager.replyByIntent, message, 'openai.request.fail', context);
  });
});
