const chai = require('chai');

const { expect } = chai;

const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { serviceId } = require('../../mocks/consts.test');
const { NukiHandlerMock } = require('../../mocks/nuki.mock.test');
const { NukiWebApiMock } = require('../../mocks/nuki-web-api.mock.test');

const {
  MAPPING_STATES_NUKI_TO_GLADYS,
  MAPPING_SWITCH_NUKI_TO_GLADYS,
} = require('../../../../../services/nuki/lib/utils/nuki.constants');

const gladys = {
  event: {
    emit: sinon.stub(),
  },
};

const device = {
  external_id: 'nuki:18144654068',
  features: [
    {
      category: 'lock',
      type: 'state',
      last_value: 0,
    },
    {
      category: 'lock',
      type: 'button',
      last_value: 1,
    },
  ],
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

  it('should poll device values for battery through nuki web api and should not update button state', async () => {
    await nukiHttpHandler.getValue(device);
    assert.calledOnce(gladys.event.emit);
    // battery 38
    const expectedBatteryState = { device_feature_external_id: 'nuki:18144654068:battery', state: 38 };
    expect(gladys.event.emit.getCall(0).args[1]).to.deep.equal(expectedBatteryState);
  });

  it('should poll device values for battery and state through nuki web api and finally update button state according to results', async () => {
    device.features[0].last_value = 1; // lock state last value
    await nukiHttpHandler.getValue(device);
    assert.calledThrice(gladys.event.emit);
    // battery 38
    const expectedBatteryState = { device_feature_external_id: 'nuki:18144654068:battery', state: 38 };
    expect(gladys.event.emit.getCall(0).args[1]).to.deep.equal(expectedBatteryState);

    const state = 1;
    // state 1 (=locked in nuki)
    const expectedDeviceState = {
      device_feature_external_id: 'nuki:18144654068:state',
      state: MAPPING_STATES_NUKI_TO_GLADYS[state],
    };
    expect(gladys.event.emit.getCall(1).args[1]).to.deep.equal(expectedDeviceState);
    // button 0 (=off in gladys)
    const expectedDeviceButton = {
      device_feature_external_id: 'nuki:18144654068:button',
      state: MAPPING_SWITCH_NUKI_TO_GLADYS[state],
    };
    expect(gladys.event.emit.getCall(2).args[1]).to.deep.equal(expectedDeviceButton);
  });
});
