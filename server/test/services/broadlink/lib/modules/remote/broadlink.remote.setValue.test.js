const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkRemoteHandler = require('../../../../../../services/broadlink/lib/modules/remote');
const { NoValuesFoundError } = require('../../../../../../utils/coreErrors');

describe('broadlink.remote.setValue', () => {
  const gladys = {};
  const serviceId = 'service-id';

  const handler = new BroadlinkRemoteHandler(gladys, serviceId);

  const peripheral = {
    sendData: fake.returns(null),
    mac: '0011223344',
  };

  afterEach(() => {
    sinon.reset();
  });

  it('send code without sub value', () => {
    const device = {
      params: [
        {
          name: 'code_binary',
          value: '0d',
        },
      ],
    };
    const feature = {
      type: 'binary',
    };
    const value = 0;

    handler.setValue(peripheral, device, feature, value);

    assert.calledOnce(peripheral.sendData);
    assert.calledWith(peripheral.sendData, Buffer.from([13]));
  });

  it('send code with sub value', () => {
    const device = {
      params: [
        {
          name: 'code_binary-0',
          value: '0d',
        },
      ],
    };
    const feature = {
      type: 'binary',
    };
    const value = 0;

    handler.setValue(peripheral, device, feature, value);

    assert.calledOnce(peripheral.sendData);
    assert.calledWith(peripheral.sendData, Buffer.from([13]));
  });

  it('send multiple codes', () => {
    const device = {
      params: [
        {
          name: 'code_channel-1',
          value: '0b',
        },
        {
          name: 'code_channel-2',
          value: '0c',
        },
      ],
    };
    const feature = {
      type: 'channel',
    };
    const value = 12;

    handler.setValue(peripheral, device, feature, value);

    assert.calledTwice(peripheral.sendData);
    assert.calledWith(peripheral.sendData, Buffer.from([11]));
    assert.calledWith(peripheral.sendData, Buffer.from([12]));
  });

  it('missing code', () => {
    const device = {
      params: [
        {
          name: 'code_channel-1',
          value: '0b',
        },
      ],
    };
    const feature = {
      type: 'channel',
    };
    const value = 12;

    try {
      handler.setValue(peripheral, device, feature, value);
    } catch (e) {
      expect(e).to.be.instanceOf(NoValuesFoundError);
    }

    assert.notCalled(peripheral.sendData);
  });
});
