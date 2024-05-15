const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const devicesMock = require('../netatmo.convertDevices.mock.test.json');
const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const [deviceMock] = devicesMock.filter((device) => device.model === 'NATherm1');

describe('Netatmo Set Value', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'connected';
    netatmoHandler.accessToken = 'valid_access_token';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should set device value successfully', async () => {
    const deviceFeatureMock = deviceMock.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const newValue = 20;

    nock('https://api.netatmo.com')
      .post('/api/setroomthermpoint')
      .reply(200, {});

    await netatmoHandler.setValue(deviceMock, deviceFeatureMock, newValue);
  });

  it('should throw an error if not home ID parameter', async () => {
    const deviceMockFake = { ...JSON.parse(JSON.stringify(deviceMock)) };
    const deviceFeatureMock = deviceMockFake.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const externalId = deviceFeatureMock.external_id;
    deviceMockFake.params = deviceMockFake.params.filter((oneParam) => oneParam.name === 'home_id');
    const newValue = 20;

    try {
      await netatmoHandler.setValue(deviceMockFake, deviceFeatureMock, newValue);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id: "${externalId}" should contains parameters "HOME_ID" and "ROOM_ID"`,
      );
    }
  });

  it('should throw an error if bad externalId prefix', async () => {
    const deviceMockFake = { ...JSON.parse(JSON.stringify(deviceMock)) };
    const deviceFeatureMock = deviceMockFake.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const externalIdFake = deviceFeatureMock.external_id.replace('netatmo:', '');
    deviceFeatureMock.external_id = externalIdFake;
    const newValue = 20;

    try {
      await netatmoHandler.setValue(deviceMockFake, deviceFeatureMock, newValue);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" should starts with "netatmo:"`,
      );
    }
  });

  it('should throw an error if no externalId topic', async () => {
    const deviceMockFake = { ...JSON.parse(JSON.stringify(deviceMock)) };
    const deviceFeatureMock = deviceMockFake.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const externalIdFake = 'netatmo';
    deviceFeatureMock.external_id = externalIdFake;
    const newValue = 20;

    try {
      await netatmoHandler.setValue(deviceMockFake, deviceFeatureMock, newValue);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" have no id and category indicator`,
      );
    }
  });

  it('should handle API errors gracefully with error 400', async () => {
    const deviceFeatureMock = deviceMock.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const newValue = 20;

    nock('https://api.netatmo.com')
      .post('/api/setroomthermpoint')
      .reply(400, {
        error: {
          code: {
            type: 'number',
            example: 21,
          },
          message: {
            type: 'string',
            example: 'invalid [parameter]',
          },
        },
      });

    await netatmoHandler.setValue(deviceMock, deviceFeatureMock, newValue);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'set_devices_value_error_unknown' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
  });

  it('should handle API errors gracefully with error 403 and code 13', async () => {
    const deviceFeatureMock = deviceMock.features.filter((feature) =>
      feature.external_id.includes('therm_setpoint_temperature'),
    )[0];
    const newValue = 20;

    nock('https://api.netatmo.com')
      .post('/api/setroomthermpoint')
      .reply(403, {
        error: {
          code: 13,
          message: 'invalid [parameter]',
        },
      });

    await netatmoHandler.setValue(deviceMock, deviceFeatureMock, newValue);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'set_devices_value_fail_scope_rights' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
  });
});
