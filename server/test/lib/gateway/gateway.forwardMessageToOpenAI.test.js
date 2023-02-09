const { fake } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');

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
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const messageManager = {
    reply: fake.resolves(null),
  };
  const brain = {
    getEntityIdByName: fake.returns('14a8ad23-78fa-45e4-8583-f5452792818d'),
  };
  const serviceManager = {};
  const stateManager = {};
  const gateway = new Gateway(
    variable,
    event,
    system,
    sequelize,
    config,
    {},
    stateManager,
    serviceManager,
    job,
    messageManager,
    brain,
  );
  gateway.connected = true;
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
});
