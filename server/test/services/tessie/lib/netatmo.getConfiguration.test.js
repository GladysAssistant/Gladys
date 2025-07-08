const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    getValue: sinon.fake((variableName, serviceId) => {
      if (variableName === 'NETATMO_CLIENT_ID') {
        return Promise.resolve('valid_client_id');
      }
      if (variableName === 'NETATMO_CLIENT_SECRET') {
        return Promise.resolve('valid_client_secret');
      }
      if (variableName === 'NETATMO_ENERGY_API') {
        return Promise.resolve('1');
      }
      if (variableName === 'NETATMO_WEATHER_API') {
        return Promise.resolve('0');
      }
      return Promise.reject(new Error('Unknown variable'));
    }),
    setValue: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo getConfiguration', () => {
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load the configuration if available', async () => {
    const configuration = await netatmoHandler.getConfiguration();
    expect(configuration.clientId).to.equal('valid_client_id');
    expect(configuration.clientSecret).to.equal('valid_client_secret');
    expect(configuration.energyApi).to.equal(true);
    expect(configuration.weatherApi).to.equal(false);
  });

  it('should throw an error if not configured', async () => {
    netatmoHandler.gladys.variable.getValue = fake.rejects(new Error('Test error'));
    try {
      await netatmoHandler.getConfiguration();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(netatmoHandler.configuration.clientId).to.equal('valid_client_id');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not configured.');
    }
  });
});
