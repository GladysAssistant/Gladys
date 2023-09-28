const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');

const gladys = {
  variable: {
    getValue: fake.resolves('APP_ACCOUNT_UID'),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const client = {
  get: fake.resolves({
    data: [
      {
        Structure: {
          Devices: [
            {
              DeviceID: 'uuid',
              DeviceName: 'name',
              BuildingID: 'building_uuid',
              Device: {
                DeviceType: 1,
                Units: [
                  {
                    Model: 'model',
                  },
                ],
              },
            },
          ],
          Areas: [],
          Floors: [
            {
              Devices: [],
              Areas: [],
            },
          ],
        },
      },
    ],
  }),
};

describe('MELCloudHandler.loadDevices', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load devices', async () => {
    const devices = await melcloudHandler.loadDevices();

    expect(devices).to.deep.eq([
      {
        BuildingID: 'building_uuid',
        Device: {
          DeviceType: 1,
          Units: [
            {
              Model: 'model',
            },
          ],
        },
        DeviceID: 'uuid',
        DeviceName: 'name',
      },
    ]);

    assert.calledOnce(client.get);
  });
});
