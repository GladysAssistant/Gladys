const sinon = require('sinon');

const ModbusTCPMock = require('./utils/ModbusTCPMock.test');
const SunSpecManager = require('../../../../services/sunspec/lib');
const { EVENTS } = require('../../../../utils/constants');

const { fake, assert } = sinon;

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec updateConfiguration', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
    sunSpecManager.devices = [
      {
        manufacturer: 'manufacturer',
        product: 'product',
        serialNumber: 'serialNumber',
        swVersion: 'swVersion',
        mppt: 1,
      },
    ];
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should find device', async () => {
    await sunSpecManager.scanDevices();

    /* expect(sunSpecManager.devices[0]).to.deep.eq({
      manufacturer: 'manufacturer',
      product: 'product',
      serialNumber: 'serialNumber',
      swVersion: 'swVersion',
      mppt: 1,
    }); */
    assert.callCount(gladys.event.emit, 4);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCA',
      state: '10.00',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCV',
      state: '110',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCW',
      state: '1200',
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCWH',
      state: '13000',
    });
  });
});
