const sinon = require('sinon');

const { expect } = require('chai');

const { stub, fake, assert } = sinon;
const EventEmitter = require('events');

const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');
const { CONFIGURATION } = require('../../../../../services/zwave-js-ui/lib/constants');
const { EVENTS } = require('../../../../../utils/constants');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const event = {
  emit: fake.resolves(null),
};

const eventMqtt = new EventEmitter();

const mqttClient = Object.assign(eventMqtt, {
  subscribe: fake.resolves(null),
  publish: fake.returns(true),
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
});

const mqtt = {
  connect: fake.returns(mqttClient),
};

describe('zwaveJSUIManager valueUpdated', () => {
  let gladys;
  let zwaveJSUIManager;
  let zwaveNode;

  before(() => {
    gladys = {
      event,
      user: {
        get: stub().resolves([{ id: ZWAVEJSUI_SERVICE_ID }]),
      },
      service: {
        getService: stub().resolves({
          list: Promise.resolve([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJSUI ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
      stateManager: {
        get: (name, value) => fake.returns(value),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);

    zwaveNode = {
      id: 1,
    };
  });

  beforeEach(() => {
    sinon.reset();

    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        name: 'name',
        ready: true,
        endpoints: [],
        type: 'type',
        product: 'product',
        classes: {
          '20': {
            0: {
              property: {},
              targetValue: {},
            },
          },
          '43': {
            0: {
              property: {},
            },
          },
          '51': {
            0: {
              'targetColor-0': {},
            },
          },
        },
      },
    };
  });

  it('should handle unknown node', () => {
    zwaveJSUIManager.valueUpdated(
      {
        id: 999,
      },
      {
        commandClass: 20,
        endpoint: 0,
        property: 'property',
        newValue: 'newValue',
      },
    );
    expect(zwaveJSUIManager.nodes[1].classes[20][0].property).to.be.empty; // eslint-disable-line
    assert.notCalled(zwaveJSUIManager.eventManager.emit);
  });

  it('should handle property currentValue', () => {
    zwaveJSUIManager.valueUpdated(zwaveNode, {
      commandClass: 20,
      endpoint: 0,
      property: 'currentValue',
      newValue: 'newValue',
    });
    expect(zwaveJSUIManager.nodes[1].classes[20][0].currentValue).to.be.undefined; // eslint-disable-line
    expect(zwaveJSUIManager.nodes[1].classes[20][0].targetValue).to.deep.equal({
      value: 'newValue',
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zwave-js-ui:node_id:1:comclass:20:endpoint:0:property:targetValue',
      state: 'newValue',
    });
  });

  it('should handle property currentColor', () => {
    zwaveJSUIManager.valueUpdated(zwaveNode, {
      commandClass: 51,
      endpoint: 0,
      property: 'currentColor',
      newValue: 180,
    });
    expect(zwaveJSUIManager.nodes[1].classes[51][0].currentColor).to.be.undefined; // eslint-disable-line
    expect(zwaveJSUIManager.nodes[1].classes[51][0]['targetColor-0']).to.deep.equal({
      value: 71,
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zwave-js-ui:node_id:1:comclass:51:endpoint:0:property:targetColor-0',
      state: 71,
    });
  });

  it('should handle value valueUpdated 20-0-property', () => {
    zwaveJSUIManager.valueUpdated(zwaveNode, {
      commandClass: 20,
      endpoint: 0,
      property: 'property',
      newValue: 'newValue',
    });
    expect(zwaveJSUIManager.nodes[1].classes[20][0].property).to.deep.equal({
      value: 'newValue',
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zwave-js-ui:node_id:1:comclass:20:endpoint:0:property:property',
      state: 'newValue',
    });
  });

  it('should handle value valueUpdated 43-0-property', () => {
    zwaveJSUIManager.valueUpdated(zwaveNode, {
      commandClass: 43,
      endpoint: 0,
      property: 'property',
      newValue: '10',
    });
    expect(zwaveJSUIManager.nodes[1].classes[43][0].property).to.deep.equal({
      value: 1,
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zwave-js-ui:node_id:1:comclass:43:endpoint:0:property:property',
      state: 1,
    });
  });
});
