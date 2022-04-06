const sinon = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const { assert, fake } = sinon;

const gladys = {
  variable: {
    getValue: fake.returns(null),
    setValue: fake.resolves(null),
    destroy: fake.returns(null),
  },
  device: {
    create: fake.resolves(null),
    destroyByServiceId: fake.resolves(null),
    saveHistoricalState: fake.resolves(null),
  },
  user: {
    get: fake.resolves([{ id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' }]),
  },
  event: { emit: fake.returns(null) },
};

describe('WithingsHandler poll', () => {
  const withingsHandler = new WithingsHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');

  it('should poll devices', async () => {
    const deviceToPoll = {
      id: 'gdfgdfgd-7207-4e55-b893-gfdgdfgkjliu',
      name: 'Withings - string',
      model: 'string',
      poll_frequency: 86400000,
      selector: 'withings-string-9f66c962-7207-4e55-b893-712642f5e043',
      service_id: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4',
      should_poll: true,
      external_id: '9f66c962-7207-4e55-b893-712642f5e043',
      params: [
        {
          name: 'WITHINGS_DEVICE_ID',
          value: 'withingsDevideId',
        },
      ],
    };

    await withingsHandler.postCreate(deviceToPoll);
    // No call because server is not on
    assert.notCalled(gladys.device.saveHistoricalState);
  });
});
