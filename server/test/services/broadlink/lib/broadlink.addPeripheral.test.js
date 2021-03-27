const { expect } = require('chai');
const { assert } = require('sinon');
const proxyrequire = require('proxyquire');

const BroadlinkDeviceSP2 = function BroadlinkDeviceSP2() {
  this.name = 'SP2';
};

const BroadlinkDeviceMP1 = function BroadlinkDeviceMP1() {
  this.name = 'MP1';
};

const BroadlinkDeviceRM2 = function BroadlinkDeviceRM2() {
  this.name = 'RM2';
  this.learnCode = true;
};

const broadlinkjs = {
  BroadlinkDeviceSP2,
  BroadlinkDeviceMP1,
  BroadlinkDeviceRM2,
};

const addPeripheral = proxyrequire('../../../../services/broadlink/lib/broadlink.addPeripheral', {
  'broadlink-js': broadlinkjs,
});

const BroadlinkHandler = proxyrequire('../../../../services/broadlink/lib', {
  './broadlink.addPeripheral': addPeripheral,
});

const gladys = {};
const broadlink = {};
const serviceId = 'service-id';

describe('BroadlinkHandler addPeripheral', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('addPeripheral not managed peripheral', () => {
    const peripheralInfo = {
      module: 'not-managed',
    };

    try {
      broadlinkHandler.addPeripheral(peripheralInfo);
      assert.fail('Should have fail');
    } catch (e) {
      expect(e.message).to.eq(`Broadlink ${peripheralInfo.module} is not recognized.`);
      expect(broadlinkHandler.peripherals).to.deep.eq({});
      expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});
    }
  });

  it('addPeripheral unknown (RM3) peripheral', () => {
    const peripheralInfo = {
      module: 'unknow',
      mac: Buffer.from([0x12, 0xac]),
      name: 'name',
      address: 'address',
    };

    broadlinkHandler.addPeripheral(peripheralInfo);

    const expectedDevices = {
      '12ac': new BroadlinkDeviceRM2(),
    };

    expect(broadlinkHandler.peripherals).to.have.key('12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('name', peripheralInfo.name);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('address', peripheralInfo.address);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('mac', '12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('canLearn', true);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('device', undefined);
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq(expectedDevices);
  });

  it('addPeripheral RM2 peripheral', () => {
    const peripheralInfo = {
      module: 'rm2',
      mac: Buffer.from([0x12, 0xac]),
      name: 'name',
      address: 'address',
    };

    broadlinkHandler.addPeripheral(peripheralInfo);

    const expectedDevices = {
      '12ac': new BroadlinkDeviceRM2(),
    };
    expect(broadlinkHandler.peripherals).to.have.key('12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('name', peripheralInfo.name);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('address', peripheralInfo.address);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('mac', '12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('canLearn', true);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('device', undefined);
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq(expectedDevices);
  });

  it('addPeripheral SP2 peripheral', () => {
    const peripheralInfo = {
      module: 'sp2',
      mac: Buffer.from([0x12, 0xac]),
      name: 'name',
      address: 'address',
    };

    broadlinkHandler.addPeripheral(peripheralInfo);

    const expectedDevices = {
      '12ac': new BroadlinkDeviceSP2(),
    };

    expect(broadlinkHandler.peripherals).to.have.key('12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('name', peripheralInfo.name);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('address', peripheralInfo.address);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('mac', '12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('canLearn', false);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('device');
    expect(broadlinkHandler.peripherals['12ac'].device).to.not.eq(undefined);
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq(expectedDevices);
  });

  it('addPeripheral MP1 peripheral', () => {
    const peripheralInfo = {
      module: 'mp1',
      mac: Buffer.from([0x12, 0xac]),
      name: 'name',
      address: 'address',
    };

    broadlinkHandler.addPeripheral(peripheralInfo);

    const expectedDevices = {
      '12ac': new BroadlinkDeviceMP1(),
    };
    expect(broadlinkHandler.peripherals).to.have.key('12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('name', peripheralInfo.name);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('address', peripheralInfo.address);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('mac', '12ac');
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('canLearn', false);
    expect(broadlinkHandler.peripherals['12ac']).to.have.property('device');
    expect(broadlinkHandler.peripherals['12ac'].device).to.not.eq(undefined);
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq(expectedDevices);
  });
});
