const sinon = require('sinon');

const { expect } = require('chai');

const { fake } = sinon;

const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';

describe('zwaveJSUIManager getNodes', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      stateManager: {
        get: fake.returns(null),
      }
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, ZWAVEJSUI_SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should receive node feature Motion 113', () => {
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
        loc: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {
          113: {
            0: {
              'Home Security-Motion sensor status': {
                genre: 'user',
                label: 'label',
                readOnly: true,
                commandClass: 113,
                endpoint: 0,
                property: 'Home Security-Motion sensor status',
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
            name: 'Détecteur de présence',
            selector: 'zwave-js-ui-node-1-home-security-motion-sensor-status-113-0-label',
            category: 'motion-sensor',
            external_id: 'zwave-js-ui:node_id:1:comclass:113:endpoint:0:property:Home Security-Motion sensor status',
            type: 'binary',
            min: undefined,
            max: undefined,
            unit: null,
            read_only: true,
            has_feedback: true,
            last_value: 0,
          },
        ],
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: 'product' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '113' },
        ],
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
        loc: 'location',
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
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: 'product' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '49' },
        ],
      },
    ]);
  });

  it('should receive node with param', () => {
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
        loc: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {
          112: {
            0: {
              'Parameter 1': {
                genre: 'config',
                label: 'label',
                value_id: 'value_id',
                value: 'value',
              },
            },
          },
        },
      },
    };
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
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
        loc: 'location',
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
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: 'product' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '37' },
        ],
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
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: 'product' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '37' },
        ],
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
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: 'product' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '37' },
        ],
      },
    ]);
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
        loc: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {},
      },
    };
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
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
        loc: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {},
      },
    };
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should return FIBARO_DIMMER2 node', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.nodes = {
      '1': {
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
        product: '271-4096-258',
        productType: 'productType',
        productId: 'productId',
        type: 'type',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        loc: 'location',
        status: 'status',
        ready: true,
        nodeType: 'nodeType',
        classes: {
          38: {
            0: {},
            1: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 100,
                readOnly: false,
                commandClass: 38,
                endpoint: 1,
                property: 'targetValue',
              },
            },
            2: {},
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1_1',
        model: '271-4096-258 firmwareVersion',
        name: 'name - 1 [1]',
        selector: 'zwave-js-ui-node-1-name-1-1',
        ready: true,
        features: [
          {
            name: 'label [1]',
            selector: 'zwave-js-ui-node-1-targetvalue-38-1-label',
            category: 'switch',
            type: 'dimmer',
            external_id: 'zwave-js-ui:node_id:1:comclass:38:endpoint:1:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: undefined,
            min: 0,
            max: 100,
            unit: null,
          },
        ],
        params: [
          { name: 'node-id', value: 1 },
          { name: 'node-product', value: '271-4096-258' },
          { name: 'node-room', value: 'location' },
          { name: 'node-classes', value: '38' },
        ],
      },
    ]);
  });
});
