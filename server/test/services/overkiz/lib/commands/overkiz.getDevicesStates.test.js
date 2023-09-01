const sinon = require('sinon');

const { fake } = sinon;

const proxyquire = require('proxyquire');
const { expect } = require('chai');
const { DEVICE_STATES } = require('../../../../../services/overkiz/lib/overkiz.constants');

describe('GetDevicesStates command', () => {
  let gladys;
  let eventManager;
  let overkizServerAPI;
  let getDevicesStates;

  beforeEach(() => {
    gladys = {
      stateManager: {
        get: fake.returns({}),
      },
    };
    eventManager = {
      emit: fake.returns(null),
    };
    overkizServerAPI = {
      get: fake.returns([
        {
          name: DEVICE_STATES.HEATING_LEVEL_STATE,
          value: '0',
        },
        {
          name: DEVICE_STATES.COMFORT_TEMPERATURE_STATE,
          value: '18',
        },
        {
          name: DEVICE_STATES.ECO_TEMPERATURE_STATE,
          value: '20',
        },
        {
          name: DEVICE_STATES.TARGET_TEMPERATURE_STATE,
          value: '20',
        },
      ]),
    };
    getDevicesStates = proxyquire('../../../../../services/overkiz/lib/commands/overkiz.getDevicesStates', {
      overkizServerAPI: { overkizServerAPI },
    }).getDevicesStates;
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should getDevicesStates', async () => {
    const device = {
      external_id: 'overkiz:',
      features: [
        {
          external_id: 'overkiz:deviceURL:io://0814-0291-7832/11410052#1:state:core:TargetTemperatureState',
        },
      ],
    };
    await getDevicesStates.bind({
      overkizServerAPI,
      gladys,
      eventManager,
    })(device);
    expect(device.features).to.be.deep.equals([
      {
        external_id: 'overkiz:deviceURL:io://0814-0291-7832/11410052#1:state:core:TargetTemperatureState',
      },
    ]);
  });
});
