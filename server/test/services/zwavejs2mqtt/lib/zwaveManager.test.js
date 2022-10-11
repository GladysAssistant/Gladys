const { expect } = require('chai');
const { assert, stub, fake, useFakeTimers } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ZwaveManager = require('../../../../services/zwave/lib');

const ZWAVE_SERVICE_ID = 'ZWAVE_SERVICE_ID';

describe('zwaveManager commands', () => {
  let gladys;
  let zwaveManager;

  before(() => {
    gladys = {
      user: {
        get: stub().resolves([{ id: ZWAVE_SERVICE_ID }]),
      },
      service: {
        getLocalServiceByName: stub().resolves({
          id: ZWAVE_SERVICE_ID,
        }),
      },
      variable: {
        getValue: stub().resolves(null),
        setValue: stub().resolves(null),
      },
    };
    zwaveManager = new ZwaveManager(gladys, event, ZWAVE_SERVICE_ID);
    zwaveManager.mqttConnected = false;
    zwaveManager.eventManager = {
      emit: stub().resolves(null),
    };
  });

  afterEach(() => {
    zwaveManager.eventManager.emit.reset();
  });

  it('should connect to zwave driver', async () => {
    const DRIVER_READY_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    await zwaveManager.connect('/dev/tty1');
    clock.tick(DRIVER_READY_TIMEOUT);
    assert.calledThrice(zwaveManager.driver.on);
    assert.calledOnce(zwaveManager.eventManager.emit);
    expect(zwaveManager.mqttConnected).to.equal(true);
    clock.restore();
  });
  it('should addNode', () => {
    const ADD_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveManager.addNode();
    clock.tick(ADD_NODE_TIMEOUT);
    expect(zwaveManager.scanInProgress).to.equal(false);
    assert.calledOnce(zwaveManager.driver.controller.beginInclusion);
    assert.calledOnce(zwaveManager.driver.controller.stopInclusion);
    clock.restore();
  });
  it('should removeNode', () => {
    const REMOVE_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveManager.removeNode();
    clock.tick(REMOVE_NODE_TIMEOUT);
    assert.calledOnce(zwaveManager.driver.controller.beginExclusion);
    assert.calledOnce(zwaveManager.driver.controller.stopExclusion);
    clock.restore();
  });
  it('should return Z-Wave status', () => {
    const status = zwaveManager.getStatus();
    expect(status).to.deep.equal({
      controller_node_id: undefined,
      suc_node_id: undefined,
      is_primary_controller: undefined,
      is_static_update_controller: undefined,
      is_bridge_controller: undefined,
      zwave_library_version: undefined,
      library_type_name: undefined,
    });
  });
  it('should return no-feature node', () => {
    zwaveManager.nodes = {
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
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
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
  it('should disconnect', async () => {
    zwaveManager.mqttConnected = true;
    await zwaveManager.disconnect();
    assert.calledOnce(zwaveManager.driver.destroy);
    expect(zwaveManager.mqttConnected).to.equal(false);
  });
  it('should disconnect again', async () => {
    zwaveManager.mqttConnected = false;
    await zwaveManager.disconnect();
    assert.notCalled(zwaveManager.driver.destroy);
    expect(zwaveManager.mqttConnected).to.equal(false);
  });
});

describe('zwaveManager events', () => {
  let gladys;
  let zwaveManager;

  before(() => {
    gladys = {
      user: {
        get: stub().resolves([{ id: ZWAVE_SERVICE_ID }]),
      },
      service: {
        getLocalServiceByName: stub().resolves({
          id: ZWAVE_SERVICE_ID,
        }),
      },
      variable: {
        getValue: stub().resolves(null),
        setValue: stub().resolves(null),
      },
    };
    zwaveManager = new ZwaveManager(gladys, event, ZWAVE_SERVICE_ID);
    zwaveManager.mqttConnected = false;
    zwaveManager.eventManager = {
      emit: stub().resolves(null),
    };
    zwaveManager.ZWaveJS = {
      Driver: fake.returns(null),
    };
  });

  beforeEach(() => {
    zwaveManager.eventManager.emit.reset();
  });

  it('should receive driverReady', () => {
    zwaveManager.driverReady('home-id');
  });
  it('should receive driverFailed', () => {
    zwaveManager.driverFailed();
  });
  it('should receive notification', () => {
    const zwaveNode = {
      id: 1,
    };
    zwaveManager.notification(zwaveNode, {}, []);
  });
  it('should receive scanComplete', () => {
    zwaveManager.scanComplete();
  });
  it('should receive node added', () => {
    const zwaveNode = {
      id: 1,
      getAllEndpoints: fake.returns([2]),
      on: stub().returnsThis(),
    };

    zwaveManager.nodes = {};
    zwaveManager.nodeAdded(zwaveNode);
    assert.calledOnce(zwaveNode.getAllEndpoints);
    assert.calledOnce(zwaveManager.eventManager.emit);
    expect(zwaveManager.nodes).to.deep.equal({
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
    zwaveManager.nodes = {
      '1': {
        id: 1,
      },
    };
    zwaveManager.nodeRemoved(zwaveNode);
    assert.calledOnce(zwaveManager.eventManager.emit);
    expect(zwaveManager.nodes).to.deep.equal({});
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
    zwaveManager.nodes = {
      '1': {
        nodeId: 1,
        classes: {},
        ready: false,
        endpoints: [2],
      },
    };
    zwaveManager.nodeReady(zwaveNode);
    assert.calledOnce(zwaveNode.getDefinedValueIDs);
    assert.calledOnce(zwaveManager.eventManager.emit);
    expect(zwaveManager.nodes).to.deep.equal({
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
    zwaveManager.nodes = {
      '1': {
        id: 1,
        classes: {},
      },
    };
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
    });
    expect(zwaveManager.nodes).to.deep.equal({
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
                readOnly: true,
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
    zwaveManager.nodes = {
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
    zwaveManager.valueRemoved(zwaveNode, {
      commandClass: 11,
      endpoint: 10,
      property: 'property',
      propertyKey: '',
    });
    expect(zwaveManager.nodes).to.deep.equal({
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

describe('zwaveManager devices', () => {
  let gladys;
  let zwaveManager;

  before(() => {
    gladys = {};
    zwaveManager = new ZwaveManager(gladys, event, ZWAVE_SERVICE_ID);
    zwaveManager.mqttConnected = true;
  });

  it('should receive node without feature/params', () => {
    zwaveManager.nodes = {
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
    const devices = zwaveManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVE_SERVICE_ID,
        external_id: 'zwave:node_id:1',
        name: 'name',
        ready: true,
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
    zwaveManager.nodes = {
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
                units: 'C',
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
    const devices = zwaveManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVE_SERVICE_ID,
        external_id: 'zwave:node_id:1',
        name: 'name',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-air-temperature-0-label-product-node-1',
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Air temperature',
            read_only: true,
            unit: 'celsius',
            has_feedback: true,
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
    zwaveManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [
          {
            index: 0,
          },
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
    const devices = zwaveManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVE_SERVICE_ID,
        external_id: 'zwave:node_id:1',
        name: 'name',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-targetvalue-0-label-product-node-1',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave:node_id:1:comclass:37:endpoint:0:property:targetValue',
            read_only: false,
            has_feedback: true,
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
        service_id: ZWAVE_SERVICE_ID,
        external_id: 'zwave:node_id:1_1',
        name: 'name [1]',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-targetvalue-1-label-product-node-1',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave:node_id:1:comclass:37:endpoint:1:property:targetValue',
            read_only: false,
            has_feedback: true,
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
        service_id: ZWAVE_SERVICE_ID,
        external_id: 'zwave:node_id:1_2',
        name: 'name [2]',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-targetvalue-2-label-product-node-1',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave:node_id:1:comclass:37:endpoint:2:property:targetValue',
            read_only: false,
            has_feedback: true,
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
