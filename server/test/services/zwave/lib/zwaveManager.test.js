const { expect } = require('chai');
const { assert, fake } = require('sinon');
// const EventEmitter = require('events');
// const event = new EventEmitter();
const ZwaveManager = require('../../../../services/zwave/lib');
const ZwaveMock = require('../ZwaveMock.test');
const nodesData = require('./nodesData.json');
const nodesExpectedResult = require('./nodesExpectedResult.json');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  service: {
    getService: () => {
      return {
        device: {
          subscribe: () => {},
        },
      };
    },
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('zwaveManager commands', () => {
  const zwaveManager = new ZwaveManager(gladys, serviceId);
  zwaveManager.ZWaveJS = ZwaveMock;
  zwaveManager.connected = true;
  it('should connect to zwave driver', () => {
    zwaveManager.connect('/dev/tty1');
    assert.calledWith(ZwaveMock.prototype.constructor, '/dev/tty1', {
      logConfig: {
        level: 'info',
      },
    });
    assert.calledOnce(zwaveManager.driver.start);
  });
  it('should addNode', () => {
    zwaveManager.addNode();
    assert.calledOnce(zwaveManager.driver.controller.beginInclusion);
  });
  it('should removeNode', () => {
    zwaveManager.removeNode();
    assert.calledOnce(zwaveManager.driver.controller.beginExclusion);
  });
  it('should heal network', () => {
    zwaveManager.healNetwork();
    assert.calledOnce(zwaveManager.driver.controller.beginHealingNetwork);
  });
  it('should return node neighbors', () => {
    const nodes = zwaveManager.getNodeNeighbors();
    expect(nodes).to.be.instanceOf(Array);
  });
  it('should refresh node params', () => {
    zwaveManager.refreshNodeParams(1);
    assert.calledWith(zwaveManager.driver.requestAllConfigParams, 1);
  });
  it('should return Z-Wave informations', () => {
    const infos = zwaveManager.getInfos();
    expect(infos).to.deep.equal({
      controller_node_id: 1,
      suc_node_id: 1,
      is_primary_controller: true,
      is_static_update_controller: true,
      is_bridge_controller: false,
      zwave_library_version: 'Z-Wave 3.99',
      library_type_name: 'Static Controller',
      send_queue_count: 3,
    });
  });
  it('should return array of nodes', () => {
    zwaveManager.nodes = nodesData;
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal(nodesExpectedResult);
  });
  it('should disconnect', () => {
    zwaveManager.disconnect();
    assert.calledOnce(zwaveManager.driver.destroy);
  });
  it('should disconnect again', () => {
    zwaveManager.disconnect();
    assert.calledOnce(zwaveManager.driver.destroy);
  });
});

describe('zwaveManager events', () => {
  const zwaveManager = new ZwaveManager(gladys, serviceId);
  it('should receive controllerCommand', () => {
    zwaveManager.controllerCommand(1, 1, 1, 'message');
  });
  it('should receive driverReady', () => {
    zwaveManager.driverReady('home-id');
  });
  it('should receive driverFailed', () => {
    zwaveManager.driverFailed();
  });
  it('should receive notification', () => {
    zwaveManager.notification({ id: 1 }, 1);
  });
  it('should receive scanComplete', () => {
    zwaveManager.scanComplete();
  });
  it('should receive node added', () => {
    const events = [];
    zwaveManager.nodeAdded({
      id: 1,
      on: (event) => {
        events.push(event);
      },
    });
    assert.match(zwaveManager.nodes[1] !== undefined, true);
    assert.match(zwaveManager.nodes[1].classes !== undefined, true);
    assert.match(events.length, 6);
    assert.match(events.indexOf('ready') > -1, true);
    assert.match(events.indexOf('value added') > -1, true);
    assert.match(events.indexOf('value updated') > -1, true);
    assert.match(events.indexOf('value notification') > -1, true);
    assert.match(events.indexOf('value removed') > -1, true);
    assert.match(events.indexOf('notification') > -1, true);
  });
  it('should receive node removed', () => {
    zwaveManager.nodeRemoved({ id: 1 });
  });
  it('should receive node ready info', () => {
    zwaveManager.nodes[1] = {
      id: 1,
      ready: true,
      classes: {},
    };
    zwaveManager.nodeReady({
      id: 1,
      manufacturer: 'Aeotec',
      manufacturerid: '0x0086',
      label: 'Z-Stick S2',
      producttype: '0x0002',
      productid: '0x0001',
      type: 1,
      name: '',
      location: '',
      getDefinedValueIDs: () => {
        return [];
      },
    });
  });
  it('should receive value added', () => {
    const { commandClass, endpoint, property } = { commandClass: 43, endpoint: 0, property: 'sceneId' };
    zwaveManager.nodes[1] = {
      id: 1,
      ready: true,
      classes: {},
    };
    zwaveManager.valueAdded(
      {
        id: 1,
        getValueMetadata: () => {
          return {
            min: 0,
            max: 4,
            label: '',
            writeable: false,
          };
        },
      },
      {
        commandClassName: 'Scene Activation',
        commandClass,
        endpoint,
        property,
        propertyName: property,
      },
    );
    assert.match(zwaveManager.nodes[1].classes !== undefined, true);
    assert.match(zwaveManager.nodes[1].classes[commandClass] !== undefined, true);
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint] !== undefined, true);
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint][property] !== undefined, true);
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint][property].min, 0);
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint][property].max, 4);
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint][property].label, '');
    assert.match(zwaveManager.nodes[1].classes[commandClass][endpoint][property].read_only, true);
  });
  it('should receive value updated', () => {
    zwaveManager.valueUpdated(
      {
        id: 1,
      },
      {
        commandClassName: 'Scene Activation',
        commandClass: 43,
        endpoint: 0,
        property: 'sceneId',
        propertyName: 'sceneId',
      },
    );
  });
  it('should receive value removed', () => {
    zwaveManager.valueRemoved(
      {
        id: 1,
      },
      {
        commandClassName: 'Scene Activation',
        commandClass: 43,
        endpoint: 0,
        property: 'sceneId',
        propertyName: 'sceneId',
      },
    );
  });
});
