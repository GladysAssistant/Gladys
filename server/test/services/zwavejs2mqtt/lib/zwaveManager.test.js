const sinon = require('sinon');

const { expect } = require('chai');

const { assert, stub, fake, useFakeTimers } = sinon;
const EventEmitter = require('events');

const Zwavejs2mqttManager = require('../../../../services/zwavejs2mqtt/lib');
const { CONFIGURATION, DEFAULT } = require('../../../../services/zwavejs2mqtt/lib/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const ZWAVEJS2MQTT_SERVICE_ID = 'ZWAVEJS2MQTT_SERVICE_ID';
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

describe('zwavejs2mqttManager commands', () => {
  let gladys;
  let zwavejs2mqttManager;

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
    zwavejs2mqttManager = new Zwavejs2mqttManager(gladys, mqtt, ZWAVEJS2MQTT_SERVICE_ID);
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should connect to zwavejs2mqtt external instance', async () => {
    zwavejs2mqttManager.mqttConnected = false;
    gladys.variable.getValue = sinon.stub();
    gladys.variable.getValue
      .onFirstCall() // EXTERNAL_ZWAVEJS2MQTT
      .resolves('1')
      .onSecondCall() // DRIVER_PATH
      .resolves(DRIVER_PATH);

    await zwavejs2mqttManager.connect();
    zwavejs2mqttManager.mqttClient.emit('connect');

    assert.calledOnceWithExactly(zwavejs2mqttManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
    });
    assert.calledOnce(mqtt.connect);
    assert.calledWith(mqttClient.subscribe, 'zwavejs2mqtt/#');
    expect(zwavejs2mqttManager.mqttConnected).to.equal(true);
    expect(zwavejs2mqttManager.mqttExist).to.equal(true);
    expect(zwavejs2mqttManager.mqttRunning).to.equal(true);
    expect(zwavejs2mqttManager.zwavejs2mqttExist).to.equal(true);
    expect(zwavejs2mqttManager.zwavejs2mqttRunning).to.equal(true);
  });

  it('should disconnect from zwavejs2mqtt external instance', async () => {
    zwavejs2mqttManager.mqttConnected = true;
    zwavejs2mqttManager.mqttClient = mqttClient;

    await zwavejs2mqttManager.disconnect();

    assert.calledOnceWithExactly(zwavejs2mqttManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS2MQTT.STATUS_CHANGE,
    });
    assert.calledOnce(mqttClient.end);
    assert.calledOnce(mqttClient.removeAllListeners);
    expect(zwavejs2mqttManager.mqttConnected).to.equal(false);
    expect(zwavejs2mqttManager.scanInProgress).to.equal(false);
  });

  it('should disconnect again from zwavejs2mqtt external instance', async () => {
    zwavejs2mqttManager.mqttConnected = false;

    await zwavejs2mqttManager.disconnect();

    assert.notCalled(zwavejs2mqttManager.eventManager.emit);
    assert.notCalled(mqttClient.end);
    assert.notCalled(mqttClient.removeAllListeners);
    expect(zwavejs2mqttManager.mqttConnected).to.equal(false);
    expect(zwavejs2mqttManager.scanInProgress).to.equal(false);
  });

  it('should addNode', () => {
    const ADD_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwavejs2mqttManager.mqttConnected = true;
    zwavejs2mqttManager.mqttClient = mqttClient;

    zwavejs2mqttManager.addNode();
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/startInclusion/set`,
    );

    clock.tick(ADD_NODE_TIMEOUT);
    expect(zwavejs2mqttManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/stopInclusion/set`,
    );
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should removeNode', () => {
    const REMOVE_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwavejs2mqttManager.mqttConnected = true;
    zwavejs2mqttManager.mqttClient = mqttClient;

    zwavejs2mqttManager.removeNode();
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/startExclusion/set`,
    );

    clock.tick(REMOVE_NODE_TIMEOUT);
    expect(zwavejs2mqttManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/startExclusion/set`,
    );
    assert.calledWithExactly(
      zwavejs2mqttManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJS2MQTT_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should return Z-Wave status', () => {
    const status = zwavejs2mqttManager.getStatus();
    expect(status).to.deep.equal({
      dockerBased: true,
      inclusionState: undefined,
      isHealNetworkActive: undefined,
      mqttConnected: false,
      mqttExist: false,
      mqttRunning: false,
      ready: undefined,
      scanInProgress: false,
      usbConfigured: false,
      zwavejs2mqttExist: false,
      zwavejs2mqttRunning: false,
    });
  });

  it('should return no-feature node', () => {
    zwavejs2mqttManager.mqttConnected = true;
    zwavejs2mqttManager.nodes = {
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
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name - 1',
        model: 'product firmwareVersion',
        service_id: 'ZWAVEJS2MQTT_SERVICE_ID',
        external_id: 'zwavejs2mqtt:node_id:1',
        selector: 'zwavejs2mqtt-node-1-name-1',
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
});

describe('zwavejs2mqttManager events', () => {
  let gladys;
  let zwavejs2mqttManager;

  before(() => {
    gladys = {
      service: {
        getService: fake.resolves({
          list: fake.resolves([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJS2MQTT ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
    };
    zwavejs2mqttManager = new Zwavejs2mqttManager(gladys, mqtt, ZWAVEJS2MQTT_SERVICE_ID);
    zwavejs2mqttManager.mqttConnected = true;
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should receive driverReady', () => {
    zwavejs2mqttManager.driverReady('home-id');
  });

  it('should receive driverFailed', () => {
    zwavejs2mqttManager.driverFailed();
  });

  it('should receive notification', () => {
    const zwaveNode = {
      id: 1,
    };
    zwavejs2mqttManager.notification(zwaveNode, {}, []);
  });

  it('should receive scanComplete', () => {
    zwavejs2mqttManager.scanComplete();
  });

  it('should receive node added', () => {
    const zwaveNode = {
      id: 1,
      getAllEndpoints: fake.returns([2]),
      on: stub().returnsThis(),
    };

    zwavejs2mqttManager.nodes = {};
    zwavejs2mqttManager.nodeAdded(zwaveNode);
    assert.calledOnce(zwaveNode.getAllEndpoints);
    assert.calledOnce(zwavejs2mqttManager.eventManager.emit);
    expect(zwavejs2mqttManager.nodes).to.deep.equal({
      '1': {
        nodeId: 1,
        classes: {},
        ready: false,
        endpoints: [2],
      },
    });
  });

  it('should receive node removed', () => {
    const zwaveNode = {
      id: 1,
    };
    zwavejs2mqttManager.nodes = {
      '1': {
        id: 1,
      },
    };
    zwavejs2mqttManager.nodeRemoved(zwaveNode);
    assert.calledOnce(zwavejs2mqttManager.eventManager.emit);
    expect(zwavejs2mqttManager.nodes).to.deep.equal({});
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
    zwavejs2mqttManager.nodes = {
      '1': {
        nodeId: 1,
        classes: {},
        ready: false,
        endpoints: [2],
      },
    };
    zwavejs2mqttManager.nodeReady(zwaveNode);
    assert.calledOnce(zwaveNode.getDefinedValueIDs);
    assert.calledOnce(zwavejs2mqttManager.eventManager.emit);
    expect(zwavejs2mqttManager.nodes).to.deep.equal({
      '1': {
        nodeId: 1,
        classes: {},
        endpoints: [2],
        type: 'nodeType',
        firmwareVersion: 'firmwareVersion',
        product: 'manufacturerId-productType-productId',
        name: 'name (1)',
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
    zwavejs2mqttManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
    });
    expect(zwavejs2mqttManager.nodes).to.deep.equal({
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
    zwavejs2mqttManager.nodes = {
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
    zwavejs2mqttManager.valueRemoved(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
      propertyKey: '',
    });
    expect(zwavejs2mqttManager.nodes).to.deep.equal({
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
});

describe('zwavejs2mqttManager devices', () => {
  let gladys;
  let zwavejs2mqttManager;

  before(() => {
    gladys = {};
    zwavejs2mqttManager = new Zwavejs2mqttManager(gladys, mqtt, ZWAVEJS2MQTT_SERVICE_ID);
    zwavejs2mqttManager.mqttConnected = true;
  });

  it('should receive node without feature/params', () => {
    zwavejs2mqttManager.nodes = {
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
    const devices = zwavejs2mqttManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJS2MQTT_SERVICE_ID,
        external_id: 'zwavejs2mqtt:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        selector: 'zwavejs2mqtt-node-1-name-1',
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
    zwavejs2mqttManager.nodes = {
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
    const devices = zwavejs2mqttManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJS2MQTT_SERVICE_ID,
        external_id: 'zwavejs2mqtt:node_id:1',
        selector: 'zwavejs2mqtt-node-1-name-1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwavejs2mqtt-node-1-air-temperature-49-0-label',
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: 'zwavejs2mqtt:node_id:1:comclass:49:endpoint:0:property:Air temperature',
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

  it.only('should receive 3 nodes feature Switch', () => {
    zwavejs2mqttManager.nodes = {
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
    const devices = zwavejs2mqttManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJS2MQTT_SERVICE_ID,
        external_id: 'zwavejs2mqtt:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        selector: 'zwavejs2mqtt-node-1-name-1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwavejs2mqtt-node-1-targetvalue-37-0-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwavejs2mqtt:node_id:1:comclass:37:endpoint:0:property:targetValue',
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
        service_id: ZWAVEJS2MQTT_SERVICE_ID,
        external_id: 'zwavejs2mqtt:node_id:1_1',
        model: 'product firmwareVersion',
        name: 'name - 1 [1]',
        selector: 'zwavejs2mqtt-node-1-name-1-1',
        ready: true,
        features: [
          {
            name: 'label [1]',
            selector: 'zwavejs2mqtt-node-1-targetvalue-37-1-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwavejs2mqtt:node_id:1:comclass:37:endpoint:1:property:targetValue',
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
        service_id: ZWAVEJS2MQTT_SERVICE_ID,
        external_id: 'zwavejs2mqtt:node_id:1_2',
        name: 'name - 1 [2]',
        model: 'product firmwareVersion',
        selector: 'zwavejs2mqtt-node-1-name-1-2',
        ready: true,
        features: [
          {
            name: 'label [2]',
            selector: 'zwavejs2mqtt-node-1-targetvalue-37-2-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwavejs2mqtt:node_id:1:comclass:37:endpoint:2:property:targetValue',
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
