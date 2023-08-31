const sinon = require('sinon');

const proxyquire = require('proxyquire');
const { EVENTS } = require('../../../../utils/constants');

const { fake, assert } = sinon;

const ScanDevices = proxyquire('../../../../services/sunspec/lib/sunspec.scanDevices', {
  './utils/sunspec.ModelFactory': {},
}).scanDevices;

describe('SunSpec updateConfiguration', () => {
  // PREPARE
  let gladys;
  let sunspecManager;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
    };

    sunspecManager = {
      gladys,
      modbus: {
        readModel: sinon
          .stub()
          .onFirstCall()
          .returns({
            readUInt16BE: sinon
              .stub()
              .onFirstCall()
              .returns(160)
              .onSecondCall() // MPTT
              .returns(1)
              .onCall(3) // ID
              .returns(1)
              .onCall(4) // DCA
              .returns(1)
              .onCall(5) // DCV
              .returns(1)
              .onCall(6) // DCW
              .returns(1),
            readInt16BE: sinon
              .stub()
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
            readUInt32BE: sinon
              .stub()
              .onFirstCall()
              .returns(1)
              .onSecondCall() // DCWH
              .returns(2),
            subarray: fake.returns('IDStr'),
          }),
      },
      devices: [
        {
          manufacturer: 'manufacturer',
          product: 'product',
          serialNumber: 'serialNumber',
          swVersion: 'swVersion',
          mppt: 1,
        },
      ],
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should find device', async () => {
    await ScanDevices.call(sunspecManager);
    assert.callCount(gladys.event.emit, 4);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCA',
      state: '10.00',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCV',
      state: '100',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCW',
      state: '1000',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCWH',
      state: '20000',
    });
  });
});
