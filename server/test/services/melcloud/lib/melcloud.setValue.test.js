const sinon = require('sinon');

const { assert, fake } = sinon;

const { expect } = require('chai');
const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const client = {
  get: fake.resolves({
    data: {
      DeviceID: 'uuid',
      DeviceName: 'name',
      BuildingID: 'building_uuid',
      Power: true,
      Device: {
        DeviceType: 0,
        Units: [
          {
            Model: 'model',
          },
        ],
      },
    },
  }),
  post: fake.resolves({}),
};

describe('MELCloudHandler.setValue', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);
  melcloudHandler.contextKey = 'contextKey';

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error (should starts with "melcloud:")', async () => {
    try {
      await melcloudHandler.setValue(
        {},
        {
          external_id: 'test:uuid:switch_0',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        1,
      );
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal(
        'MELCloud device external_id is invalid: "test:uuid:switch_0" should starts with "melcloud:"',
      );
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await melcloudHandler.setValue(
        {},
        {
          external_id: 'melcloud:',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        1,
      );
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('MELCloud device external_id is invalid: "melcloud:" have no network indicator');
    }
  });

  it('should call melcloud api', async () => {
    await melcloudHandler.setValue(
      {
        params: [
          {
            name: 'buildingID',
            value: '12345',
          },
        ],
      },
      {
        external_id: 'melcloud:uuid:switch_0',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      },
      1,
    );

    assert.calledOnce(client.get);
    assert.calledWith(
      client.post,
      '/Device/SetAta',
      {
        BuildingID: 'building_uuid',
        Device: { DeviceType: 0, Units: [{ Model: 'model' }] },
        DeviceID: 'uuid',
        DeviceName: 'name',
        HasPendingCommand: true,
        Power: true,
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:73.0) ',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'X-MitsContextKey': 'contextKey',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: 'policyaccepted=true',
        },
      },
    );
  });
});
