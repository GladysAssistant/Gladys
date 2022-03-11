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
      config: {
        servicesFolder: fake.returns('/tmp'),
      },
    };
    zwaveManager = new ZwaveManager(gladys, event, ZWAVE_SERVICE_ID);
    zwaveManager.connected = false;
    zwaveManager.eventManager = {
      emit: stub().resolves(null),
    };
    zwaveManager.ZWaveJS = {
      Driver: stub().returns({
        on: fake.returns(null),
        start: stub().resolves('the value you want to return'),
        destroy: stub().resolves(null),
        enableErrorReporting: fake.resolves(null),
        controller: {
          beginInclusion: fake.returns(null),
          stopInclusion: fake.returns(null),
          beginExclusion: fake.returns(null),
          stopExclusion: fake.returns(null),
          beginHealingNetwork: fake.returns(null),
        },
      }),
    };
    zwaveManager.driver = {
      destroy: stub().resolves(null),
    };
    zwaveManager.updateConfigJob = {
      cancel: stub().resolves(null),
    };
  });

  afterEach(() => {
    zwaveManager.driver.destroy.reset();
    zwaveManager.updateConfigJob.cancel.reset();
    zwaveManager.eventManager.emit.reset();
  });

  it('should connect to zwave driver', async () => {
    const DRIVER_READY_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    await zwaveManager.connect('/dev/tty1');
    clock.tick(DRIVER_READY_TIMEOUT);
    assert.calledThrice(zwaveManager.driver.on);
    assert.calledOnce(zwaveManager.eventManager.emit);
    expect(zwaveManager.connected).to.equal(true);
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
  it('should heal network', () => {
    zwaveManager.healNetwork();
    assert.calledOnce(zwaveManager.driver.controller.beginHealingNetwork);
  });
  it('should return node neighbors', async () => {
    const nodes = await zwaveManager.getNodeNeighbors();
    expect(nodes).to.be.instanceOf(Array);
  });
  it('should refresh node params', () => {
    const refreshValues = fake.returns(null);
    zwaveManager.driver.controller.nodes = {
      get: (id) => {
        return {
          refreshValues,
        };
      },
    };
    zwaveManager.refreshNodeParams(1);
    assert.calledOnce(refreshValues);
  });
  it('should return Z-Wave informations', () => {
    const infos = zwaveManager.getInfos();
    expect(infos).to.deep.equal({
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
        deviceDatabaseUrl: 'deviceDatabaseUrl',
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
        model: 'product firmwareVersion',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: [],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        features: [],
        params: [],
      },
    ]);
  });
  it('should disconnect', async () => {
    zwaveManager.connected = true;
    await zwaveManager.disconnect();
    assert.calledOnce(zwaveManager.driver.destroy);
    assert.calledOnce(zwaveManager.updateConfigJob.cancel);
    expect(zwaveManager.connected).to.equal(false);
  });
  it('should disconnect again', async () => {
    zwaveManager.connected = false;
    await zwaveManager.disconnect();
    assert.notCalled(zwaveManager.driver.destroy);
    assert.calledOnce(zwaveManager.updateConfigJob.cancel);
    expect(zwaveManager.connected).to.equal(false);
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
    zwaveManager.connected = false;
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
      deviceDatabaseUrl: 'deviceDatabaseUrl',
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
        deviceDatabaseUrl: 'deviceDatabaseUrl',
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
    zwaveManager.connected = true;
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
        deviceDatabaseUrl: 'deviceDatabaseUrl',
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
    expect(devices.length).equal(3);

    expect(devices[0].features.length).equal(1);
    expect(devices[0].features[0]).to.deep.equal({
      name: 'label',
      selector: 'zwave-node-1-targetvalue-37-0-label',
      category: 'switch',
      type: 'binary',
      external_id: 'zwave:node_id:1:comclass:37:endpoint:0:property:targetValue',
      read_only: true,
      has_feedback: true,
      min: 0,
      max: 1,
      unit: null,
    });

    expect(devices[1].features.length).equal(1);
    expect(devices[1].features[0]).to.deep.equal({
      name: 'label',
      selector: 'zwave-node-1-targetvalue-37-1-label',
      category: 'switch',
      type: 'binary',
      external_id: 'zwave:node_id:1:comclass:37:endpoint:1:property:targetValue',
      read_only: true,
      has_feedback: true,
      min: 0,
      max: 1,
      unit: null,
    });

    expect(devices[2].features.length).equal(1);
    expect(devices[2].features[0]).to.deep.equal({
      name: 'label',
      selector: 'zwave-node-1-targetvalue-37-2-label',
      category: 'switch',
      type: 'binary',
      external_id: 'zwave:node_id:1:comclass:37:endpoint:2:property:targetValue',
      read_only: true,
      has_feedback: true,
      min: 0,
      max: 1,
      unit: null,
    });
  });
});
