const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { MELCLOUD_HOME_API_ENDPOINT } = require('../../../../services/melcloud-home/lib/utils/melcloud-home.constants');
const { BadParameters, NotFoundError } = require('../../../../utils/coreErrors');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const unit = {
  id: 'unit-1',
  settings: [
    { name: 'Power', value: 'False' },
    { name: 'OperationMode', value: 'Cool' },
    { name: 'SetTemperature', value: '28' },
    { name: 'SetFanSpeed', value: 'Four' },
    { name: 'VaneVerticalDirection', value: 'Swing' },
    { name: 'VaneHorizontalDirection', value: 'Swing' },
    { name: 'InStandbyMode', value: 'False' },
  ],
};

describe('MELCloudHomeHandler.setValue', () => {
  let handler;
  let client;

  beforeEach(() => {
    sinon.reset();
    client = { put: fake.resolves({}) };
    handler = new MELCloudHomeHandler({}, serviceId, client);
    handler.getAccessToken = fake.resolves('access-token');
    handler.loadDevices = fake.resolves([unit]);
  });

  it('should throw if external_id does not start with melcloud-home', async () => {
    let error;
    try {
      await handler.setValue({}, { external_id: 'melcloud:uuid:power' }, 1);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should throw if external_id has no unit id', async () => {
    let error;
    try {
      await handler.setValue({}, { external_id: 'melcloud-home:' }, 1);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should throw for a non-writable feature', async () => {
    let error;
    try {
      await handler.setValue({}, { external_id: 'melcloud-home:unit-1:room-temperature' }, 20);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(BadParameters);
  });

  it('should throw when the unit is not found', async () => {
    let error;
    try {
      await handler.setValue({}, { external_id: 'melcloud-home:unknown-unit:temperature' }, 22);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(NotFoundError);
  });

  it('should send the full merged command to the MELCloud Home API', async () => {
    await handler.setValue({}, { external_id: 'melcloud-home:unit-1:temperature' }, 22);

    assert.calledWith(
      client.put,
      `${MELCLOUD_HOME_API_ENDPOINT}/monitor/ataunit/unit-1`,
      {
        power: false,
        operationMode: 'Cool',
        setTemperature: 22,
        setFanSpeed: 'Four',
        vaneVerticalDirection: 'Swing',
        vaneHorizontalDirection: 'Swing',
        temperatureIncrementOverride: null,
        inStandbyMode: false,
      },
      {
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        },
      },
    );
  });
});
