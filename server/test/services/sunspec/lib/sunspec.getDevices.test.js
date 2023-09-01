const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const proxyquire = require('proxyquire');
const ModbusTCPMock = require('./utils/ModbusTCPMock.test');

const SunSpecManager = proxyquire('../../../../services/sunspec/lib', {
  ModbusTCP: { ModbusTCP: ModbusTCPMock },
  modbus: ModbusTCPMock,
});

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('SunSpec getDevices', () => {
  // PREPARE
  let gladys;
  let sunSpecManager;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('sunspecUrl'),
      },
    };

    sunSpecManager = new SunSpecManager(gladys, ModbusTCPMock, SERVICE_ID);
  });

  it('should no device', async () => {
    sunSpecManager.devices = [];
    const devices = await sunSpecManager.getDevices();
    expect(devices.length).eql(0);
  });

  it('should device', async () => {
    sunSpecManager.devices = [
      {
        manufacturer: 'manufacturer',
        product: 'product',
        serialNumber: 'serialNumber',
        swVersion: 'swVersion',
        mppt: 1,
      },
    ];
    const devices = await sunSpecManager.getDevices();
    expect(devices.length).eql(1);
    expect(devices[0]).to.deep.equals({
      model: 'manufacturer product [1]',
      name: 'manufacturer product [1]',
      external_id: 'sunspec:serialnumber:serialNumber:mptt:1',
      poll_frequency: 60000,
      selector: 'sunspec-manufacturer-manufacturer-product-1',
      service_id: 'faea9c35-759a-44d5-bcc9-2af1de37b8b4',
      should_poll: true,
      features: [
        {
          category: 'pv',
          external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCA',
          has_feedback: false,
          last_value: 0,
          max: 400,
          min: 0,
          name: 'manufacturer product [1] - DCA',
          read_only: true,
          selector: 'sunspec-device-serialnumber-1-dca',
          type: 'current',
          unit: 'ampere',
        },
        {
          category: 'pv',
          external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCV',
          has_feedback: false,
          last_value: 0,
          max: 400,
          min: 0,
          name: 'manufacturer product [1] - DCV',
          read_only: true,
          selector: 'sunspec-device-serialnumber-1-dcv',
          type: 'voltage',
          unit: 'volt',
        },
        {
          category: 'pv',
          external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCW',
          has_feedback: false,
          last_value: 0,
          max: 10000,
          min: 0,
          name: 'manufacturer product [1] - DCW',
          read_only: true,
          selector: 'sunspec-device-serialnumber-1-dcw',
          type: 'power',
          unit: 'watt',
        },
        {
          category: 'pv',
          external_id: 'sunspec:serialnumber:serialNumber:mptt:1:property:DCWH',
          has_feedback: false,
          last_value: 0,
          max: 1000000,
          min: 0,
          name: 'manufacturer product [1] - DCWH',
          read_only: true,
          selector: 'sunspec-device-serialnumber-1-dcwh',
          type: 'energy',
          unit: 'kilowatt-hour',
        },
      ],
      params: [
        {
          name: 'MANUFACTURER',
          value: 'manufacturer',
        },
        {
          name: 'PRODUCT',
          value: 'product',
        },
        {
          name: 'SERIAL_NUMBER',
          value: 'serialNumber',
        },
        {
          name: 'SW_VERSION',
          value: 'swVersion',
        },
      ],
    });
  });

  it('should found device by manufacturer', async () => {
    sunSpecManager.devices = [
      {
        manufacturer: 'manufacturer',
        product: 'product',
        serialNumber: 'serialNumber',
        swVersion: 'swVersion',
        mppt: 1,
      },
    ];
    const devices = await sunSpecManager.getDevices({
      search: 'manu',
    });
    expect(devices.length).eql(1);
  });

  it('should found device by product', async () => {
    sunSpecManager.devices = [
      {
        manufacturer: 'manufacturer',
        product: 'product',
        serialNumber: 'serialNumber',
        swVersion: 'swVersion',
        mppt: 1,
      },
    ];
    const devices = await sunSpecManager.getDevices({
      search: 'prod',
    });
    expect(devices.length).eql(1);
  });

  it('should not found device', async () => {
    sunSpecManager.devices = [
      {
        manufacturer: 'manufacturer',
        product: 'product',
        serialNumber: 'serialNumber',
        swVersion: 'swVersion',
        mppt: 1,
      },
    ];
    const devices = await sunSpecManager.getDevices({
      search: 'serial',
    });
    expect(devices.length).eql(0);
  });
});
