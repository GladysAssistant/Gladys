const sinon = require('sinon');

const { stub, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

const gladysDevices = [
  {
    externalId: 'ewelink:1',
    should_poll: true,
    poll_frequency: 30000,
    features: [{ type: 'binary', category: 'switch' }],
    params: [
      {
        name: 'ONLINE',
        value: '1',
      },
      {
        name: 'FIRMWARE',
        value: '?.?.?',
      },
      {
        name: 'IP_ADDRESS',
        value: 'xx.xx.xx.xx.xx',
      },
    ],
  },
  {
    externalId: 'ewelink:2',
    should_poll: false,
    features: [{ type: 'binary', category: 'light' }],
    params: [
      {
        name: 'ONLINE',
        value: '1',
      },
      {
        name: 'FIRMWARE',
        value: '3.2.1',
      },
    ],
  },
];

const expectedGladysDevices = [
  {
    externalId: 'ewelink:1',
    should_poll: false,
    features: [{ type: 'binary', category: 'switch' }],
    params: [
      {
        name: 'ONLINE',
        value: '1',
      },
    ],
  },
  {
    externalId: 'ewelink:2',
    should_poll: false,
    features: [{ type: 'binary', category: 'light' }],
    params: [
      {
        name: 'ONLINE',
        value: '1',
      },
      {
        name: 'FIRMWARE',
        value: '3.2.1',
      },
    ],
  },
];

describe('eWeLinkHandler init', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: stub().resolves(null),
        setValue: stub(),
        destroy: stub(),
      },
      device: {
        get: stub().resolves(gladysDevices),
        create: stub().resolves({}),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not apply updates', async () => {
    gladys.variable.getValue.onFirstCall().resolves('10000');

    await eWeLinkHandler.upgrade();

    assert.calledOnceWithExactly(gladys.variable.getValue, 'SERVICE_VERSION', SERVICE_ID);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
  });

  it('should apply all updates', async () => {
    await eWeLinkHandler.upgrade();

    assert.calledOnceWithExactly(gladys.variable.getValue, 'SERVICE_VERSION', SERVICE_ID);

    assert.callCount(gladys.variable.destroy, 3);
    assert.callCount(gladys.variable.setValue, 2);

    // v2
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_EMAIL', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_PASSWORD', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_REGION', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.setValue, 'SERVICE_VERSION', '2', SERVICE_ID);

    // v3
    assert.calledOnceWithExactly(gladys.device.get, { service_id: SERVICE_ID });
    assert.callCount(gladys.device.create, 2);
    assert.calledWithExactly(gladys.device.create, expectedGladysDevices[0]);
    assert.calledWithExactly(gladys.device.create, expectedGladysDevices[1]);
    assert.calledWithExactly(gladys.variable.setValue, 'SERVICE_VERSION', '3', SERVICE_ID);
  });
});
