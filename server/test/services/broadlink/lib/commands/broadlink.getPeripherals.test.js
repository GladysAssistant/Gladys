const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.getPeripherals', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  let broadlinkHandler;

  beforeEach(() => {
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
    broadlinkHandler.init = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('no peripherals', async () => {
    const peripherals = await broadlinkHandler.getPeripherals();

    expect(peripherals).to.deep.eq([]);
    assert.calledOnceWithExactly(broadlinkHandler.init);
  });

  it('with peripherals', async () => {
    const device1 = {
      name: 'p1',
    };
    const device2 = {
      name: 'p2',
    };

    broadlinkHandler.peripherals = {
      'device-1': device1,
      'device-2': device2,
    };

    const peripherals = await broadlinkHandler.getPeripherals();

    expect(peripherals).to.deep.eq([device1, device2]);
    assert.calledOnceWithExactly(broadlinkHandler.init);
  });
});
