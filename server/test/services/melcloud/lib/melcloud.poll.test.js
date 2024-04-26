const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { EVENTS } = require('../../../../utils/constants');

const { BadParameters } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
  event: {
    emit: fake.returns(null),
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
};

describe('MELCloudHandler.poll', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error (should starts with "melcloud:")', async () => {
    try {
      await melcloudHandler.poll({
        external_id: 'test:device',
        features: [
          {
            external_id: 'melcloud:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal(
        'MELCloud device external_id is invalid: "test:device" should starts with "melcloud:"',
      );
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await melcloudHandler.poll({
        external_id: 'melcloud',
        features: [
          {
            external_id: 'melcloud:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('MELCloud device external_id is invalid: "melcloud" have no network indicator');
    }
  });

  it('change state of device feature', async () => {
    await melcloudHandler.poll({
      external_id: 'melcloud:device',
      features: [
        {
          external_id: 'melcloud:feature:power',
          category: 'light',
          type: 'binary',
        },
      ],
      params: [
        {
          name: 'buildingID',
          value: 'building_uuid',
        },
      ],
    });

    assert.calledOnce(client.get);

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'melcloud:feature:power',
      state: 1,
    });
  });
});
