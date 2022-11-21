const { expect } = require('chai');
const sinon = require('sinon');
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');
const { DEFAULT } = require('../../../../../services/zwave-js-ui/lib/constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const { assert, fake } = sinon;

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const event = {
  emit: fake.resolves(null),
};
const mqtt = fake.resolves(null);

describe('zwave gladys node event', () => {
  let gladys;
  let zwaveJSUIManager;
  let node;

  before(() => {
    gladys = {
      event,
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
  });
  beforeEach(() => {
    node = {
      id: 1,
      ready: true,
      classes: {},
    };
    zwaveJSUIManager.nodes = {
      '1': node,
    };
    zwaveJSUIManager.scanInProgress = false;
    zwaveJSUIManager.valueUpdated = fake.returns(null);
    // sinon.reset();
  });
  it('should default _CLIENTS', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_CLIENTS`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default status', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/???/status`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default nodeinfo', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/???/nodeinfo`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default scanInProgress', () => {
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/???`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default set', () => {
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeId/commandClass/endpoint/propertyName/set`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default not supported commandClass', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeId/112/endpoint/propertyName/set`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default node empty message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/commandClass/endpoint/propertyName/propertyKey`, '');
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
  it('should default node true message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/0/0/propertyName/propertyKey`, 'true');
    assert.calledOnce(zwaveJSUIManager.valueUpdated);
    /* assert.calledOnceWithExactly(zwaveJSUIManager.valueUpdated, {
      id: 1,
    },
    {
      commandClass: 0,
      endpoint: 0,
      property: 'propertyName',
      propertyKey: 'propertyKey',
      newValue: true,
    }); */
  });
  it('should default node false message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/0/0/propertyName/propertyKey`, 'false');
    assert.calledOnce(zwaveJSUIManager.valueUpdated);
    /* assert.calledOnceWithExactly(zwaveJSUIManager.valueUpdated, {
      id: 1,
    },
    {
      commandClass: 0,
      endpoint: 0,
      property: 'propertyName',
      propertyKey: 'propertyKey',
      newValue: false,
    }); */
  });
  it('should default node number message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/0/0/propertyName/propertyKey`, '1');
    assert.calledOnce(zwaveJSUIManager.valueUpdated);
    /* assert.calledOnceWithExactly(zwaveJSUIManager.valueUpdated, {
      id: 1,
    },
    {
      commandClass: 0,
      endpoint: 0,
      property: 'propertyName',
      propertyKey: 'propertyKey',
      newValue: 1,
    }); */
  });
  it('should default node not a number message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/0/0/propertyName/propertyKey`, '???');
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });
});

describe('zwave event', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.driver = {};
    zwaveJSUIManager.scanComplete = fake.returns(null);
  });
  beforeEach(() => {
    sinon.reset();
  });
  it('should send driver_ready event', () => {
    const message = {
      data: [
        {
          homeId: 'homeId',
          controllerId: 'controllerId',
        },
      ],
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/driver/driver_ready`,
      JSON.stringify(message),
    );
    expect(zwaveJSUIManager.driver.homeId).equals('homeId');
    expect(zwaveJSUIManager.driver.controllerId).equals('controllerId');
  });
  it('should send all_nodes_ready event', () => {
    const message = {
      data: [{}],
    };
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/driver/all_nodes_ready`,
      JSON.stringify(message),
    );
    assert.calledOnce(zwaveJSUIManager.scanComplete);
  });
  it('should send statistics_updated event', () => {
    const message = {
      data: ['data'],
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/controller/statistics_updated`,
      JSON.stringify(message),
    );
    expect(zwaveJSUIManager.driver.statistics).equals('data');
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.STATUS_CHANGE,
    });
  });
  it('should send driver status event', () => {
    const message = {};
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/driver/status`, JSON.stringify(message));
    assert.notCalled(event.emit);
  });
  it('should send status event', () => {
    const message = {};
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/status`,
      JSON.stringify(message),
    );
    assert.notCalled(event.emit);
  });
  it('should send version event', () => {
    const message = {};
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/version`,
      JSON.stringify(message),
    );
    assert.notCalled(event.emit);
  });
  it('should send getNodes event', () => {
    const message = {};
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`,
      JSON.stringify(message),
    );
    assert.notCalled(event.emit);
  });
});

/* describe('zwave node event', () => {
  let gladys;
  let zwaveJSUIManager;
  let node;

  before(() => {
    gladys = {
      event,
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.valueAdded = fake.returns(null);
  });
  beforeEach(() => {
    node = {
      id: 1,
    };
    zwaveJSUIManager.nodes = {
      '1': node
    };
    sinon.reset();
  });
  it('should send node_alive event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_alive`, 
      JSON.stringify(message)
    );
    expect(node.ready).equals(true);
    expect(node.state).equals(NODE_STATES.ALIVE);
  });
  it.only('should send node_ready event', () => {
    const message = {
      data: [{
        id: 1,
        data: {
          manufacturerId: 'manufacturerId',
          productType: 'productType',
          productId: 'productId',
          nodeType: 'nodeType',
          firmwareVersion: 'firmwareVersion',
          name: 'name',
          label: 'label',
          location: 'location',
          status: 'status',
          ready: 'ready',
        }
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_ready`, 
      JSON.stringify(message)
    );
    expect(node.nodeId).equals(1);
    expect(node.product).equals(1);
    expect(node.type).equals('nodeType');
    expect(node.firmwareVersion).equals('firmwareVersion');
    expect(node.location).equals('location');
    expect(node.status).equals('status');
    assert.calledOnceWithExactly(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.NODE_READY,
      payload: {
        nodeId: 1,
        name: 'name',
        status: 'status',
      },
    });
  });
  it('should send node_sleep event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_sleep`, 
      JSON.stringify(message)
    );
    expect(node.ready).to.be.undefined;
    expect(node.state).equals(NODE_STATES.SLEEP);
  });
  it('should send node_dead event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_dead`, 
      JSON.stringify(message)
    );
    expect(node.ready).to.be.undefined;
    expect(node.state).equals(NODE_STATES.DEAD);
  });
  it('should send node_wakeup event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_wakeup`, 
      JSON.stringify(message)
    );
    expect(node.ready).to.be.undefined;
    expect(node.state).equals(NODE_STATES.WAKE_UP);
  });
  it('should send node_value_added event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_value_added`, 
      JSON.stringify(message)
    );
    expect(node).to.deep.equal({
      id: 1,
    });
  });
  it('should send node_value_updated event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_value_updated`, 
      JSON.stringify(message)
    );
    expect(node).to.deep.equal({
      id: 1,
    });
  });
  it('should send node_metadata_updated event', () => {
    const message = {
      data: [{
        id: 1
      }]
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/node_metadata_updated`, 
      JSON.stringify(message)
    );
    expect(node).to.deep.equal({
      id: 1,
    });
  });
  it('should send statistics_updated event', () => {
    const message = {
      data: [
        1
      ]
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_EVENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/node/statistics_updated`, JSON.stringify(message));
    expect(node).to.deep.equal({
      id: 1,
    });
  });
}); */