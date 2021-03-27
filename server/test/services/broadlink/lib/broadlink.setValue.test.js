const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../services/broadlink/lib');

const gladys = {};
const broadlink = {};
const serviceId = 'service-id';
const broadlinkDevice = {
  setPower: fake.returns(null),
  sendData: fake.returns(null),
};

describe('BroadlinkHandler setValue', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  beforeEach(() => {
    broadlinkHandler.broadlinkDevices = {
      '12ac': broadlinkDevice,
    };

    sinon.reset();
  });

  it('setValue sp2 ON', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'sp2',
    };
    const feature = {};
    const value = 1;

    broadlinkHandler.setValue(device, feature, value);

    assert.calledWith(broadlinkDevice.setPower, 'on');
    assert.notCalled(broadlinkDevice.sendData);
  });

  it('setValue sp2 OFF', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'sp2',
    };
    const feature = {};
    const value = 0;

    broadlinkHandler.setValue(device, feature, value);

    assert.calledWith(broadlinkDevice.setPower, 0);
    assert.notCalled(broadlinkDevice.sendData);
  });

  it('setValue mp1 ON', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'mp1',
    };
    const feature = {};
    const value = 1;

    broadlinkHandler.setValue(device, feature, value);

    assert.calledWith(broadlinkDevice.setPower, 'on', 2);
    assert.notCalled(broadlinkDevice.sendData);
  });

  it('setValue mp1 OFF', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'mp1',
    };
    const feature = {};
    const value = 0;

    broadlinkHandler.setValue(device, feature, value);

    assert.calledWith(broadlinkDevice.setPower, 0, 2);
    assert.notCalled(broadlinkDevice.sendData);
  });

  it('setValue rm2 IR code', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'remote-control:television',
      params: [
        {
          name: 'code_power-on-button',
          value: '22FF',
        },
      ],
    };
    const feature = {
      type: 'power-on-button',
    };
    const value = 1;

    broadlinkHandler.setValue(device, feature, value);

    assert.notCalled(broadlinkDevice.setPower);
    assert.calledWith(broadlinkDevice.sendData, Buffer.from('22FF', 'hex'));
  });

  it('setValue rm2 code not found', () => {
    const device = {
      external_id: 'broadlink:12ac:2',
      model: 'remote-control:television',
      params: [],
    };
    const feature = {};
    const value = 0;

    broadlinkHandler.setValue(device, feature, value);

    assert.notCalled(broadlinkDevice.setPower);
    assert.notCalled(broadlinkDevice.sendData);
  });
});
