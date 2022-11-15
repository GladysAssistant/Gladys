const sinon = require('sinon');

const { expect } = require('chai');

const { assert, fake, useFakeTimers } = sinon;
const EventEmitter = require('events');

const ZwaveJSUIManager = require('../../../../services/zwave-js-ui/lib');
const { CONFIGURATION, DEFAULT, NODE_STATES } = require('../../../../services/zwave-js-ui/lib/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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

describe('zwaveJSUIManager commands', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: () => {
          return {
            list: () => Promise.resolve([DRIVER_PATH]),
          };
        },
      },
      variable: {
        getValue: fake.resolves(true),
        setValue: fake.resolves(true),
      },
      system: {
        isDocker: fake.resolves(true),
      },
      installMqttContainer: fake.returns(true),
      installZ2mContainer: fake.returns(true),
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should connect to zwave-js-ui external instance', async () => {
    zwaveJSUIManager.mqttConnected = false;
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJSUI
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwaveJSUIManager.connect();
    zwaveJSUIManager.mqttClient.emit('connect');

    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(mqtt.connect);
    assert.calledWith(mqttClient.subscribe, 'zwave-js-ui/#');
    expect(zwaveJSUIManager.mqttConnected).to.equal(true);
    expect(zwaveJSUIManager.mqttExist).to.equal(true);
    expect(zwaveJSUIManager.mqttRunning).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIExist).to.equal(true);
    expect(zwaveJSUIManager.zwaveJSUIRunning).to.equal(true);
  });

  it('should disconnect from zwave-js-ui external instance', async () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    await zwaveJSUIManager.disconnect();

    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
    assert.calledOnce(mqttClient.end);
    assert.calledOnce(mqttClient.removeAllListeners);
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should disconnect again from zwave-js-ui external instance', async () => {
    zwaveJSUIManager.mqttConnected = false;

    await zwaveJSUIManager.disconnect();

    assert.notCalled(zwaveJSUIManager.eventManager.emit);
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
    expect(zwaveJSUIManager.mqttConnected).to.equal(false);
    expect(zwaveJSUIManager.scanInProgress).to.equal(false);
  });

  it('should addNode', () => {
    const ADD_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.addNode();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startInclusion/set`,
    );

    clock.tick(ADD_NODE_TIMEOUT);
    expect(zwaveJSUIManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopInclusion/set`,
    );
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should removeNode', () => {
    const REMOVE_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.removeNode();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`,
    );

    clock.tick(REMOVE_NODE_TIMEOUT);
    expect(zwaveJSUIManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`,
    );
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should healNetwork', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.healNetwork();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
  });

  it('should setValue', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    const commandClass = 2;
    const endpoint = 3;
    const property = 'property';
    const device = {
      nodeId: 1,
    };
    const deviceFeature = {
      external_id: `zwave-js-ui:node_id:${device.nodeId}:comclass:${commandClass}:endpoint:${endpoint}:property:${property}`,
    };
    zwaveJSUIManager.setValue(device, deviceFeature, 0);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/nodeID_${device.nodeId}/${commandClass}/${endpoint}/${property}/set`,
      '0',
    );
  });

  it('should setValue with property key', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    const commandClass = 2;
    const endpoint = 3;
    const property = 'property';
    const propertyKey = 'propertyKey';
    const device = {
      nodeId: 1,
    };
    const deviceFeature = {
      external_id: `zwave-js-ui:node_id:${device.nodeId}:comclass:${commandClass}:endpoint:${endpoint}:property:${property}-${propertyKey}`,
    };
    zwaveJSUIManager.setValue(device, deviceFeature, 0);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/nodeID_${device.nodeId}/${commandClass}/${endpoint}/${property}/${propertyKey}/set`,
      '0',
    );
  });

  it('should return Z-Wave status', () => {
    const status = zwaveJSUIManager.getStatus();
    expect(status).to.deep.equal({
      dockerBased: true,
      inclusionState: undefined,
      isHealNetworkActive: undefined,
      mqttConnected: true,
      mqttExist: true,
      mqttRunning: true,
      ready: undefined,
      scanInProgress: true,
      usbConfigured: true,
      zwaveJSUIExist: true,
      zwaveJSUIRunning: true,
    });
  });

  it('should return no-feature node', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        endpoints: [], // No split
        manufacturerId: 'manufacturerId',
        product: 'product',
        productType: 'productType',
        productId: 'productId',
        type: 'type',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        location: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {},
      },
    };
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name - 1',
        model: 'product firmwareVersion',
        service_id: 'ZWAVEJSUI_SERVICE_ID',
        external_id: 'zwave-js-ui:node_id:1',
        selector: 'zwave-js-ui-node-1-name-1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: [],
        },
        features: [],
        params: [],
      },
    ]);
  });

  it('should updateConfiguration', () => {
    const configuration = {
      externalZwaveJSUI: true,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      s2UnauthenticatedKe: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(setValueStub, CONFIGURATION.DRIVER_PATH, 'driverPath', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(setValueStub, CONFIGURATION.ZWAVEJSUI_MQTT_URL, 'mqttUrl', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, 'mqttUsername', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, 'mqttPassword', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_UNAUTHENTICATED, 's2UnauthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_AUTHENTICATED, 's2AuthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_ACCESS_CONTROL, 's2AccessControlKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S0_LEGACY, 's0LegacyKey', ZWAVEJSUI_SERVICE_ID);
  });
});

describe('zwaveJSUIManager events', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: fake.resolves({
          list: fake.resolves([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJSUI ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should receive notification', () => {
    const zwaveNode = {
      id: 1,
    };
    zwaveJSUIManager.notification(zwaveNode, {}, []);
  });

  it('should receive scanComplete', () => {
    zwaveJSUIManager.scanComplete();
  });

  it('should receive node ready info', () => {
    const zwaveNode = {
      id: 1,
      manufacturerId: 'manufacturerId',
      product: 'product',
      productType: 'productType',
      productId: 'productId',
      type: 'type',
      firmwareVersion: 'firmwareVersion',
      name: 'name',
      location: 'location',
      status: 'status',
      ready: true,
      nodeType: 'nodeType',
      getDefinedValueIDs: fake.returns([]),
    };
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        classes: {},
        ready: false,
        endpoints: [2],
      },
    };
    zwaveJSUIManager.nodeReady(zwaveNode);
    assert.calledOnce(zwaveNode.getDefinedValueIDs);
    assert.calledOnce(zwaveJSUIManager.eventManager.emit);
    expect(zwaveJSUIManager.nodes).to.deep.equal({
      '1': {
        nodeId: 1,
        classes: {},
        endpoints: [2],
        type: 'nodeType',
        firmwareVersion: 'firmwareVersion',
        product: 'manufacturerId-productType-productId',
        name: 'name',
        location: 'location',
        status: 'status',
        ready: true,
      },
    });
  });

  it('should receive value added', () => {
    const zwaveNode = {
      id: 1,
      getValueMetadata: (args) => {
        return {
          type: 'number',
          label: 'label',
          min: 1,
          max: 2,
        };
      },
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
    });
    expect(zwaveJSUIManager.nodes).to.deep.equal({
      1: {
        id: 1,
        classes: {
          11: {
            // commandClass
            10: {
              // endpoint
              property: {
                commandClass: 11,
                endpoint: 10,
                genre: 'user',
                label: 'label',
                max: 2,
                min: 1,
                nodeId: 1,
                property: 'property',
                type: 'number',
              },
            },
          },
        },
      },
    });
  });

  it('should receive value removed', () => {
    const zwaveNode = {
      id: 1,
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {
          '11': {
            // commandClass
            '10': {
              // endpoint
              property: {
                commandClass: 11,
                endpoint: 10,
                genre: 'user',
                label: 'label',
                max: 2,
                min: 1,
                nodeId: 1,
                property: 'property',
                read_only: true,
              },
            },
          },
        },
      },
    };
    zwaveJSUIManager.valueRemoved(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
      propertyKey: '',
    });
    expect(zwaveJSUIManager.nodes).to.deep.equal({
      '1': {
        id: 1,
        classes: {
          '11': {
            '10': {},
          },
        },
      },
    });
  });

  it('should set node state to INTERVIEW_STARTED', () => {
    const zwaveNode = {
      id: 1,
      getValueMetadata: (args) => {
        return {
          type: 'number',
          label: 'label',
          min: 1,
          max: 2,
        };
      },
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveJSUIManager.nodeInterviewStarted(zwaveNode);
    assert.match(zwaveJSUIManager.nodes[1].state, NODE_STATES.INTERVIEW_STARTED);
  });

  it('should set node state to INTERVIEW_STAGE_COMPLETED', () => {
    const zwaveNode = {
      id: 1,
      getValueMetadata: (args) => {
        return {
          type: 'number',
          label: 'label',
          min: 1,
          max: 2,
        };
      },
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveJSUIManager.nodeInterviewStageCompleted(zwaveNode, 'stage');
    assert.match(zwaveJSUIManager.nodes[1].state, NODE_STATES.INTERVIEW_STAGE_COMPLETED);
  });

  it('should set node state to INTERVIEW_COMPLETED', () => {
    const zwaveNode = {
      id: 1,
      getValueMetadata: (args) => {
        return {
          type: 'number',
          label: 'label',
          min: 1,
          max: 2,
        };
      },
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveJSUIManager.nodeInterviewCompleted(zwaveNode);
    assert.match(zwaveJSUIManager.nodes[1].state, NODE_STATES.INTERVIEW_COMPLETED);
  });

  it('should set node state to INTERVIEW_FAILED', () => {
    const zwaveNode = {
      id: 1,
      getValueMetadata: (args) => {
        return {
          type: 'number',
          label: 'label',
          min: 1,
          max: 2,
        };
      },
    };
    zwaveJSUIManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveJSUIManager.nodeInterviewFailed(zwaveNode);
    assert.match(zwaveJSUIManager.nodes[1].state, NODE_STATES.INTERVIEW_FAILED);
  });
});

describe('zwaveJSUIManager devices', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {};
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
  });

  it('should receive node without feature/params', () => {
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
        product: 'product',
        productType: 'productType',
        productId: 'productId',
        type: 'type',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        location: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {},
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        selector: 'zwave-js-ui-node-1-name-1',
        features: [],
        params: [],
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: [],
        },
      },
    ]);
  });

  it('should receive node feature Temperature', () => {
    zwaveJSUIManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
        product: 'product',
        productType: 'productType',
        productId: 'productId',
        type: 'type',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        location: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {
          49: {
            0: {
              'Air temperature': {
                genre: 'user',
                label: 'label',
                min: -20,
                max: 40,
                unit: '°C',
                readOnly: true,
                commandClass: 49,
                endpoint: 0,
                property: 'Air temperature',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        selector: 'zwave-js-ui-node-1-name-1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-js-ui-node-1-air-temperature-49-0-label',
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Air temperature',
            read_only: true,
            unit: 'celsius',
            has_feedback: true,
            last_value: undefined,
            min: -20,
            max: 40,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
        },
      },
    ]);
  });

  it('should receive 3 nodes feature Switch', () => {
    zwaveJSUIManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [
          {
            index: 1,
          },
          {
            index: 2,
          },
        ],
        manufacturerId: 'manufacturerId',
        product: 'product',
        productType: 'productType',
        productId: 'productId',
        type: 'type',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        location: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {
          37: {
            0: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 0,
                property: 'targetValue',
              },
            },
            1: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 1,
                property: 'targetValue',
              },
            },
            2: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 2,
                property: 'targetValue',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        selector: 'zwave-js-ui-node-1-name-1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-js-ui-node-1-targetvalue-37-0-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:0:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['37'],
        },
      },
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1_1',
        model: 'product firmwareVersion',
        name: 'name - 1 [1]',
        selector: 'zwave-js-ui-node-1-name-1-1',
        ready: true,
        features: [
          {
            name: 'label [1]',
            selector: 'zwave-js-ui-node-1-targetvalue-37-1-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:1:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['37'],
        },
      },
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1_2',
        name: 'name - 1 [2]',
        model: 'product firmwareVersion',
        selector: 'zwave-js-ui-node-1-name-1-2',
        ready: true,
        features: [
          {
            name: 'label [2]',
            selector: 'zwave-js-ui-node-1-targetvalue-37-2-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:2:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['37'],
        },
      },
    ]);
  });
});
