const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { TuyaContext } = require('../tuya.mock.test');

const { assert, fake } = sinon;

const connect = proxyquire('../../../../services/tuya/lib/tuya.connect', {
  '@tuya/tuya-connector-nodejs': { TuyaContext },
});
const TuyaHandler = proxyquire('../../../../services/tuya/lib/index', {
  './tuya.connect.js': connect,
});
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
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

describe('TuyaHandler.poll', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: [{ code: 'code', value: true }], total: 1, has_more: true, last_row_key: 'next' }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error (should starts with "tuya:")', async () => {
    try {
      await tuyaHandler.poll({
        external_id: 'test:device',
        features: [
          {
            external_id: 'tuya:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "test:device" should starts with "tuya:"');
    }
  });

  it('should throw an error (have no network indicator)', async () => {
    try {
      await tuyaHandler.poll({
        external_id: 'tuya',
        features: [
          {
            external_id: 'tuya:feature',
            category: 'light',
            type: 'binary',
          },
        ],
      });
    } catch (error) {
      expect(error).to.be.an.instanceof(BadParameters);
      expect(error.message).to.equal('Tuya device external_id is invalid: "tuya" have no network indicator');
    }
  });

  it('change state of device feature', async () => {
    await tuyaHandler.poll({
      external_id: 'tuya:device',
      features: [
        {
          external_id: 'tuya:feature',
          category: 'light',
          type: 'binary',
        },
      ],
    });

    assert.callCount(tuyaHandler.connector.request, 1);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/device/status`,
    });

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tuya:feature',
      state: 0,
    });
  });
});
