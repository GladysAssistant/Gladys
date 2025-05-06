const chai = require('chai');
const { expect } = chai;

const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { serviceId } = require('../../mocks/consts.test');
const { NukiHandlerMock } = require('../../mocks/nuki.mock.test');
const { NukiWebApiMock } = require('../../mocks/nuki-web-api.mock.test');

const gladys = {
  event: {
    emit: sinon.stub(),
  },
};

const device = {
  external_id: 'nuki:18144654068',
};

const NukiHTTPHandler = proxyquire('../../../../../services/nuki/lib/http', {
  'nuki-web-api': NukiWebApiMock,
});

describe('nuki.http.getValue command', () => {
  let nukiHttpHandler;

  beforeEach(() => {
    const nukiHandler = new NukiHandlerMock(gladys, serviceId);
    nukiHttpHandler = new NukiHTTPHandler(nukiHandler);
    nukiHttpHandler.nukiApi = new NukiWebApiMock('test123');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get battery and state value through nuki web api', async () => {
    await nukiHttpHandler.getValue(device);
    assert.calledTwice(gladys.event.emit);
    // battery 38
    const expectedBatteryState = { device_feature_external_id: 'nuki:18144654068:battery', state: 38 };
    expect(gladys.event.emit.getCall(0).args[1]).to.deep.equal(expectedBatteryState);
    // state 1
    const expectedDeviceState = { device_feature_external_id: 'nuki:18144654068:state', state: 1 };
    expect(gladys.event.emit.getCall(1).args[1]).to.deep.equal(expectedDeviceState);
  });
});
