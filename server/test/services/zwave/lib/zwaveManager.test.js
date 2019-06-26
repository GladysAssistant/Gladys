const { expect } = require('chai');
const { assert } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ZwaveManager = require('../../../../services/zwave/lib');
const ZwaveMock = require('../ZwaveMock.test');

describe('zwaveManager commands', () => {
  const zwaveManager = new ZwaveManager(ZwaveMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  zwaveManager.connected = true;
  it('should connect to zwave driver', () => {
    zwaveManager.connect('/dev/tty1');
    assert.calledWith(zwaveManager.zwave.connect, '/dev/tty1');
  });
  it('should addNode', () => {
    zwaveManager.addNode();
    assert.calledOnce(zwaveManager.zwave.addNode);
  });
  it('should removeNode', () => {
    zwaveManager.removeNode();
    assert.calledOnce(zwaveManager.zwave.removeNode);
  });
  it('should heal network', () => {
    zwaveManager.healNetwork();
    assert.calledOnce(zwaveManager.zwave.healNetwork);
  });
  it('should return node neighbors', () => {
    const nodes = zwaveManager.getNodeNeighbors();
    expect(nodes).to.be.instanceOf(Array);
  });
  it('should refresh node params', () => {
    zwaveManager.refreshNodeParams(1);
    assert.calledWith(zwaveManager.zwave.requestAllConfigParams, 1);
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
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.be.instanceOf(Array);
  });
  it('should disconnect', () => {
    zwaveManager.disconnect();
    assert.calledOnce(zwaveManager.zwave.disconnect);
  });
});

describe('zwaveManager events', () => {
  const zwaveManager = new ZwaveManager(ZwaveMock, event, 'de051f90-f34a-4fd5-be2e-e502339ec9bc');
  it('should receive controllerCommand', () => {
    zwaveManager.controllerCommand(1, 1, 1, 'message');
  });
  it('should receive driverReady', () => {
    zwaveManager.driverReady('home-id');
  });
  it('should receive driverFailed', () => {
    zwaveManager.driverFailed();
  });
  it('should receive node event', () => {
    zwaveManager.nodeEvent(1, {});
  });
  it('should receive notification', () => {
    zwaveManager.notification(1, 1);
  });
  it('should receive scanComplete', () => {
    zwaveManager.scanComplete();
  });
  it('should receive node added', () => {
    zwaveManager.nodeAdded(1);
  });
  it('should receive node ready info', () => {
    zwaveManager.nodeReady(1, {
      manufacturer: 'Aeotec',
      manufacturerid: '0x0086',
      product: 'Z-Stick S2',
      producttype: '0x0002',
      productid: '0x0001',
      type: 'Static PC Controller',
      name: '',
      loc: '',
    });
  });
  it('should receive value added', () => {
    zwaveManager.valueAdded(1, 10, {
      value_id: '5-32-1-0',
      node_id: 5,
      class_id: 32,
      type: 'byte',
      genre: 'basic',
      instance: 1,
      index: 0,
      label: 'Basic',
      units: '',
      help: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 0,
    });
  });
  it('should receive value changed', () => {
    zwaveManager.valueChanged(1, 10, {
      value_id: '5-32-1-0',
      node_id: 5,
      class_id: 32,
      type: 'byte',
      genre: 'basic',
      instance: 1,
      index: 0,
      label: 'Basic',
      units: '',
      help: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 0,
    });
  });
  it('should receive value removed', () => {
    zwaveManager.valueRemoved(1, 10, 0);
  });
});
