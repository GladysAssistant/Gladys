const sinon = require('sinon');

const proxyquire = require('proxyquire');
const { EVENTS } = require('../../../../utils/constants');

const { fake, assert, stub } = sinon;

const ScanDevices = proxyquire('../../../../services/sunspec/lib/sunspec.scanDevices', {
  './utils/sunspec.ModelFactory': {},
}).scanDevices;

describe('SunSpec scanDevices', () => {
  // PREPARE
  let modbus;
  let sunspecManager;

  beforeEach(() => {
    modbus = {
      readModel: fake.throws(new Error('Model must be defined')),
    };

    sunspecManager = {
      gladys: {
        stateManager: {
          get: fake.resolves({}),
        },
      },
      eventManager: {
        emit: fake.returns(null),
      },
      modbuses: [modbus],
      devices: [],
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should find device AC', async () => {
    sunspecManager.devices.push({
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      modbus,
    });
    sunspecManager.modbuses[0].readModel = stub()
      .onFirstCall()
      .returns({
        readUInt16BE: stub()
          .onFirstCall()
          .returns(101)
          .onSecondCall() // ACA
          .returns(1)
          .onThirdCall() // ACV
          .returns(2),
        readInt16BE: stub()
          .onFirstCall() // acaSf
          .returns(1)
          .onSecondCall() // acvSf
          .returns(2)
          .onThirdCall() // acwSf
          .returns(3)
          .onCall(3) // ACW
          .returns(4)
          .onCall(4) // acwhSf
          .returns(5),
        readUInt32BE: stub()
          .onFirstCall()
          .returns(1)
          .onSecondCall() // ACWH
          .returns(2),
      });
    await ScanDevices.call(sunspecManager);
    assert.callCount(sunspecManager.eventManager.emit, 4);
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACA',
      state: '10.00',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACV',
      state: '200',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACW',
      state: '4000',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACWH',
      state: '100',
    });
  });

  it('should find device 3-AC', async () => {
    sunspecManager.devices.push({
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      modbus,
    });
    sunspecManager.modbuses[0].readModel = stub()
      .onFirstCall()
      .returns({
        readUInt16BE: stub()
          .onFirstCall()
          .returns(103)
          .onSecondCall() // ACA
          .returns(1)
          .onThirdCall() // acvA
          .returns(2)
          .onCall(3) // acvB
          .returns(3)
          .onCall(4) // acvC
          .returns(4),
        readInt16BE: stub()
          .onFirstCall() // acaSf
          .returns(1)
          .onSecondCall() // acvSf
          .returns(2)
          .onThirdCall() // acwSf
          .returns(3)
          .onCall(3) // ACW
          .returns(4)
          .onCall(4) // acwhSf
          .returns(5),
        readUInt32BE: stub()
          .onFirstCall()
          .returns(1)
          .onSecondCall() // ACWH
          .returns(2),
      });
    await ScanDevices.call(sunspecManager);
    assert.callCount(sunspecManager.eventManager.emit, 4);
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACA',
      state: '10.00',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACV',
      state: '300',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACW',
      state: '4000',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:ac:property:ACWH',
      state: '100',
    });
  });

  it('should find device DC', async () => {
    sunspecManager.devices.push({
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      mppt: 1,
      modbus,
    });
    sunspecManager.modbuses[0].readModel = stub()
      .onFirstCall()
      .returns({
        readUInt16BE: stub()
          .onFirstCall()
          .returns(160)
          .onSecondCall() // MPPT
          .returns(1)
          .onCall(3) // ID
          .returns(1)
          .onCall(4) // DCA
          .returns(1)
          .onCall(5) // DCV
          .returns(1)
          .onCall(6) // DCW
          .returns(1),
        readInt16BE: stub()
          .onFirstCall()
          .returns(1)
          .onSecondCall()
          .returns(2)
          .onThirdCall()
          .returns(3)
          .onCall(3)
          .returns(4)
          .onCall(4)
          .returns(0)
          .onCall(5)
          .returns(0),
        readUInt32BE: stub()
          .onFirstCall()
          .returns(1)
          .onSecondCall() // DCWH
          .returns(2),
        subarray: fake.returns('IDStr'),
      });
    await ScanDevices.call(sunspecManager);
    assert.callCount(sunspecManager.eventManager.emit, 4);
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:dc1:property:DCA',
      state: '10.00',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:dc1:property:DCV',
      state: '100',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:dc1:property:DCW',
      state: '1000',
    });
    assert.calledWithExactly(sunspecManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mppt:dc1:property:DCWH',
      state: '20',
    });
  });
});
