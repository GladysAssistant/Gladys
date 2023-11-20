const sinon = require('sinon');

const { expect } = require('chai');
const proxyquire = require('proxyquire');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { fake, assert, stub } = sinon;

const ScanNetwork = proxyquire('../../../../services/sunspec/lib/sunspec.scanNetwork', {
  './utils/sunspec.ModelFactory': {},
}).scanNetwork;

describe('SunSpec scanNetwork', () => {
  // PREPARE
  let gladys;
  let modbus;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };

    modbus = {
      readModel: stub()
        .onFirstCall()
        .returns({
          readUInt16BE: stub()
            .onFirstCall()
            .returns(1),
          subarray: stub()
            .onFirstCall()
            .returns('manufacturer')
            .onSecondCall()
            .returns('product')
            .onThirdCall()
            .returns('options')
            .onCall(3)
            .returns('swVersion')
            .onCall(4)
            .returns('serialNumber'),
        }),
      readRegisterAsInt16: fake.returns(1),
      getValueModel: fake.returns(201),
    };

    sunSpecManager = {
      gladys,
      modbuses: [modbus],
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should find a AC and a DC device', async () => {
    await ScanNetwork.call(sunSpecManager);
    expect(sunSpecManager.devices.length).eql(2);
    expect(sunSpecManager.devices[0]).to.deep.eq({
      modbus,
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      valueModel: 201,
    });
    expect(sunSpecManager.devices[1]).to.deep.eq({
      modbus,
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      mppt: 1,
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.SUNSPEC.STATUS_CHANGE,
    });
  });
});
