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

  it('should poll device values as battery or state through nuki web api and finally and update button state according to results', async () => {
    await nukiHttpHandler.getValue(device);
    assert.calledThrice(gladys.event.emit);
    // battery 38
    const expectedBatteryState = { device_feature_external_id: 'nuki:18144654068:battery', state: 38 };
    expect(gladys.event.emit.getCall(0).args[1]).to.deep.equal(expectedBatteryState);
    // state 1 (=locked in nuki)
    const expectedDeviceState = { device_feature_external_id: 'nuki:18144654068:state', state: 1 };
    expect(gladys.event.emit.getCall(1).args[1]).to.deep.equal(expectedDeviceState);
    // button 0 (=off in gladys)
    const expectedDeviceButton = { device_feature_external_id: 'nuki:18144654068:button', state: 0 };
    expect(gladys.event.emit.getCall(2).args[1]).to.deep.equal(expectedDeviceButton);
  });
});
