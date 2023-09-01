const sinon = require('sinon');

const { expect } = require('chai');
const proxyquire = require('proxyquire');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { fake, assert } = sinon;

const ScanNetwork = proxyquire('../../../../services/sunspec/lib/sunspec.scanNetwork', {
  './utils/sunspec.ModelFactory': {},
}).scanNetwork;

describe('SunSpec scanNetwork', () => {
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
              .returns(1),
            subarray: sinon
              .stub()
              .onFirstCall()
              .returns('manufacturer')
              .onSecondCall()
              .returns('product')
              .onThirdCall()
              .returns('swVersion')
              .onCall(3)
              .returns('serialNumber'),
          }),
        readRegisterAsInt16: fake.returns(1),
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

  it('should find one device', async () => {
    await ScanNetwork.call(sunspecManager);
    expect(sunspecManager.devices.length).eql(1);
    expect(sunspecManager.devices[0]).to.deep.eq({
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
