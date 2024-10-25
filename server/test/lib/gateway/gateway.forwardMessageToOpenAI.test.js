const { fake, assert } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');

const StateManager = require('../../../lib/state');
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
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'co2-sensor', {
      id: 'bd2eaaef-5baa-4aa6-8c94-ccce01026a53',
      service_id: '59d7e9e2-a5a5-43b0-8796-287e00670355',
      room_id: '3dc8243a-983f-45bc-94e8-f0c651b78c5d',
      name: 'Capteur salon',
      selector: 'mqtt-test',
      model: null,
      external_id: 'mqtt:test',
      should_poll: false,
      poll_frequency: null,
      created_at: '2024-08-10T07:34:51.798Z',
      updated_at: '2024-10-18T02:00:49.733Z',
      features: [
        {
          id: '31fc42aa-f338-40c1-bcc0-c14d37470e71',
          device_id: 'bd2eaaef-5baa-4aa6-8c94-ccce01026a53',
          name: 'Batterie',
          selector: 'mqtt-battery',
          external_id: 'mqtt:battery',
          category: 'battery',
          type: 'integer',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          unit: 'percent',
          min: 0,
          max: 100,
          last_value: null,
          last_value_string: null,
          last_value_changed: null,
          last_hourly_aggregate: null,
          last_daily_aggregate: null,
          last_monthly_aggregate: null,
          created_at: '2024-10-04T01:10:45.283Z',
          updated_at: '2024-10-04T01:11:22.787Z',
        },
        {
          id: '444b306d-5a2c-49f6-a8a5-ffe2a1d7cb11',
          device_id: 'bd2eaaef-5baa-4aa6-8c94-ccce01026a53',
          name: 'Niveau de Co2',
          selector: 'mqtt-co2',
          external_id: 'mqtt:co2',
          category: 'co2-sensor',
          type: 'integer',
          read_only: true,
          keep_history: true,
          has_feedback: false,
          unit: 'ppm',
          min: 0,
          max: 100000,
          last_value: 1200,
          last_value_string: null,
          last_value_changed: '2024-10-18T01:40:12.042Z',
          last_hourly_aggregate: null,
          last_daily_aggregate: null,
          last_monthly_aggregate: null,
          created_at: '2024-10-04T01:11:22.783Z',
          updated_at: '2024-10-18T02:01:16.000Z',
        },
      ],
      params: [],
      room: {
        id: '3dc8243a-983f-45bc-94e8-f0c651b78c5d',
        house_id: 'ec0e36a8-f370-4157-9249-3892a6e3a52c',
        name: 'salon',
        selector: 'salon',
        created_at: '2024-10-11T06:43:37.620Z',
        updated_at: '2024-10-11T06:43:37.620Z',
      },
      service: {
        id: '59d7e9e2-a5a5-43b0-8796-287e00670355',
        pod_id: null,
        name: 'mqtt',
        selector: 'mqtt',
        version: '0.1.0',
        has_message_feature: false,
        status: 'RUNNING',
        created_at: '2024-08-08T12:59:46.450Z',
        updated_at: '2024-10-18T02:08:20.564Z',
      },
    });
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
    assert.calledWith(gateway.gladysGatewayClient.openAIAsk, {
      question: 'Turn on the light in the living room',
      image: undefined,
      previous_questions: [],
    });
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
