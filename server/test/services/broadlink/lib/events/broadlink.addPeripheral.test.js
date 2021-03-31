const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.addPeripheral', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  const peripheralInfo = {
    mac: Buffer.from('0011223344', 'hex'),
    module: 'not-managed',
    name: 'bad-name',
  };
  const device = { name: 'device' };
  const peripheral = { name: 'peripheral' };

  const notMatcherHander = {
    matchPeripheral: fake.returns(false),
  };
  const matcherHandler = {
    matchPeripheral: fake.returns(true),
    buildPeripheral: fake.returns({ device, peripheral }),
  };
  const avoidedMatcher = {
    matchPeripheral: fake.returns(true),
  };

  afterEach(() => {
    sinon.reset();
  });

  it('no handler matches', () => {
    broadlinkHandler.handlers = [notMatcherHander];

    broadlinkHandler.addPeripheral(peripheralInfo);

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});

    assert.calledWith(notMatcherHander.matchPeripheral, peripheralInfo);
  });

  it('handler matches', () => {
    broadlinkHandler.handlers = [notMatcherHander, matcherHandler, avoidedMatcher];

    broadlinkHandler.addPeripheral(peripheralInfo);

    expect(broadlinkHandler.peripherals).to.deep.eq({
      '0011223344': { name: 'peripheral', mac: '0011223344', address: undefined },
    });
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({ '0011223344': device });

    assert.calledWith(notMatcherHander.matchPeripheral, peripheralInfo);
    assert.calledWith(matcherHandler.matchPeripheral, peripheralInfo);
    assert.notCalled(avoidedMatcher.matchPeripheral);

    assert.calledWith(matcherHandler.buildPeripheral, peripheralInfo);
  });
});
