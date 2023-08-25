const sinon = require('sinon');

const { assert, fake } = sinon;

const { expect } = require('chai');
const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.setValue', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: { list: [{ id: 1 }], total: 2, has_more: true, last_row_key: 'next' } })
        .onSecondCall()
        .resolves({ result: { list: [{ id: 2 }], total: 2, has_more: false } }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error (should starts with "tuya:")', async () => {
    try {
      await tuyaHandler.setValue(
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
        'Tuya device external_id is invalid: "test:uuid:switch_0" should starts with "tuya:"',
      );
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await tuyaHandler.setValue(
        {},
        {
          external_id: 'tuya:',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        },
        1,
      );
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "tuya:" have no network indicator');
    }
  });

  it('should call tuya api', async () => {
    await tuyaHandler.setValue(
      {},
      {
        external_id: 'tuya:uuid:switch_0',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      },
      1,
    );

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'POST',
      path: `${API.VERSION_1_0}/devices/uuid/commands`,
      body: { commands: [{ code: 'switch_0', value: true }] },
    });
  });
});
