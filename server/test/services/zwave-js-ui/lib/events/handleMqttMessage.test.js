const { expect } = require('chai');
const sinon = require('sinon');
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');
const { DEFAULT } = require('../../../../../services/zwave-js-ui/lib/constants');

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
    zwaveJSUIManager.nodeReady = fake.returns(null);
    zwaveJSUIManager.valueAdded = fake.returns(null);
    zwaveJSUIManager.scanComplete = fake.resolves(null);
    zwaveJSUIManager.scanNetwork = fake.resolves(null);
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

  it('should get zwaveJSUI Version', () => {
    const message = {
      value: 'version',
    };
    zwaveJSUIManager.handleMqttMessage(
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/version`,
      JSON.stringify(message),
    );
    assert.notCalled(zwaveJSUIManager.valueUpdated);
    expect(zwaveJSUIManager.zwaveJSUIVersion).to.equal('version');
  });

  it('should default scanInProgress', () => {
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/???`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });

  it('should not managed set', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeId/commandClass/endpoint/propertyName/set`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });

  it('should not managed not supported commandClass', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeId/112/endpoint/propertyName`, null);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });

  it('should update node empty message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/nodeID_1/0/0/propertyName/propertyKey`, '');
    assert.calledOnceWithExactly(
      zwaveJSUIManager.valueUpdated,
      {
        id: 1,
      },
      {
        commandClass: 0,
        endpoint: 0,
        property: 'propertyName',
        propertyKey: 'propertyKey',
        newValue: '',
      },
    );
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

  it('should shift node location', () => {
    zwaveJSUIManager.mqttTopicWithLocation = true;
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/location/nodeId_1/48/0/propertyName`, 0);
    zwaveJSUIManager.mqttTopicWithLocation = false;
    assert.calledOnceWithExactly(
      zwaveJSUIManager.valueUpdated,
      {
        id: 1,
      },
      {
        commandClass: 48,
        endpoint: 0,
        property: 'propertyName',
        propertyKey: undefined,
        newValue: 0,
      },
    );
  });

  it('should not managed message', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/0123456789`, 0);
    assert.notCalled(zwaveJSUIManager.valueUpdated);
  });

  it('should getNodes in scan mode success', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`, {
      success: true,
      result: [
        {
          id: 1,
          endpoints: [
            {
              index: 0,
            },
          ],
          label: 'productLabel',
          values: {
            38: {
              commandClass: 38,
              endpoint: 0,
              property: 'property_property',
            },
            48: {
              commandClass: 48,
              endpoint: 0,
              propertyName: 'propertyName_propertyName',
            },
          },
        },
      ],
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.nodeReady, {
      nodeId: 1,
      classes: {},
      endpoints: [
        {
          index: 0,
        },
      ],
      label: 'productLabel',
    });
    assert.calledWithExactly(
      zwaveJSUIManager.valueAdded,
      {
        id: 1,
      },
      {
        commandClass: 38,
        endpoint: 0,
        property: 'property property',
        propertyKey: undefined,
      },
    );
    assert.calledWithExactly(
      zwaveJSUIManager.valueAdded,
      {
        id: 1,
      },
      {
        commandClass: 48,
        endpoint: 0,
        property: 'propertyName propertyName',
        propertyKey: undefined,
      },
    );
    assert.calledOnce(zwaveJSUIManager.scanComplete);
    expect(Object.keys(zwaveJSUIManager.nodes).length).to.equal(1);
    expect(zwaveJSUIManager.nodes['1']).to.not.be.null; // eslint-disable-line
  });

  it('should getNodes in scan mode error', () => {
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes`, {
      success: false,
    });
    assert.notCalled(zwaveJSUIManager.scanComplete);
    assert.calledOnce(zwaveJSUIManager.scanNetwork);
  });

  it('should send driver status event', () => {
    const message = {};
    zwaveJSUIManager.handleMqttMessage(`${DEFAULT.ROOT}/driver/status`, JSON.stringify(message));
    assert.notCalled(event.emit);
  });
});
