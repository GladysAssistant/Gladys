const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { API } = require('../../../../services/tuya/lib/utils/tuya.constants');
const logger = require('../../../../utils/logger');

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const buildExpectedReport = ({
  deviceId,
  listEntry,
  specificationResponse,
  detailsResponse,
  propertiesResponse,
  modelResponse,
  specificationError = null,
  detailsError = null,
  propertiesError = null,
  modelError = null,
  specifications = null,
  properties = null,
  thingModel = null,
}) => ({
  schema_version: 2,
  cloud: {
    assembled: {
      specifications,
      properties,
      thing_model: thingModel,
    },
    raw: {
      device_list_entry: {
        request: {
          method: 'GET',
          path: `${API.PUBLIC_VERSION_1_0}/users/{sourceId}/devices`,
        },
        response_item: listEntry,
      },
      device_specification: {
        request: {
          method: 'GET',
          path: `${API.VERSION_1_2}/devices/${deviceId}/specification`,
        },
        response: specificationResponse,
        error: specificationError,
      },
      device_details: {
        request: {
          method: 'GET',
          path: `${API.VERSION_1_0}/devices/${deviceId}`,
        },
        response: detailsResponse,
        error: detailsError,
      },
      thing_shadow_properties: {
        request: {
          method: 'GET',
          path: `${API.VERSION_2_0}/thing/${deviceId}/shadow/properties`,
        },
        response: propertiesResponse,
        error: propertiesError,
      },
      thing_model: {
        request: {
          method: 'GET',
          path: `${API.VERSION_2_0}/thing/${deviceId}/model`,
        },
        response: modelResponse,
        error: modelError,
      },
    },
  },
  local: {
    scan: null,
  },
});

describe('TuyaHandler.loadDeviceDetails', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onCall(0)
        .resolves({ result: { details: 'specification' } })
        .onCall(1)
        .resolves({ result: { local_key: 'localKey' } })
        .onCall(2)
        .resolves({ result: { dps: { 1: true } } })
        .onCall(3)
        .resolves({ result: { model: '{"services":[]}' } }),
    };
  });

  afterEach(() => {
    sinon.reset();
    if (logger.warn.restore) {
      logger.warn.restore();
    }
  });

  it('should load device details', async () => {
    const devices = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(devices).to.deep.eq({
      id: 1,
      local_key: 'localKey',
      specifications: { details: 'specification' },
      properties: { dps: { 1: true } },
      thing_model: { services: [] },
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: { result: { details: 'specification' } },
        detailsResponse: { result: { local_key: 'localKey' } },
        propertiesResponse: { result: { dps: { 1: true } } },
        modelResponse: { result: { model: '{"services":[]}' } },
        specifications: { details: 'specification' },
        properties: { dps: { 1: true } },
        thingModel: { services: [] },
      }),
    });

    assert.callCount(tuyaHandler.connector.request, 4);
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_2}/devices/1/specification`,
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/1`,
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_2_0}/thing/1/shadow/properties`,
    });
    assert.calledWith(tuyaHandler.connector.request, {
      method: 'GET',
      path: `${API.VERSION_2_0}/thing/1/model`,
    });
  });

  it('should preserve category in specifications when only available in details', async () => {
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .resolves({ result: { functions: [], status: [] } })
      .onCall(1)
      .resolves({ result: { local_key: 'localKey', category: 'cz' } })
      .onCall(2)
      .resolves({ result: { dps: { 1: true } } })
      .onCall(3)
      .resolves({ result: { model: '{"services":[]}' } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device.specifications.category).to.equal('cz');
  });

  it('should warn when specifications loading fails', async () => {
    const warnStub = sinon.stub(logger, 'warn');
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .rejects(new Error('spec failure'))
      .onCall(1)
      .resolves({ result: { local_key: 'localKey' } })
      .onCall(2)
      .resolves({ result: { dps: { 1: true } } })
      .onCall(3)
      .resolves({ result: { model: '{"services":[]}' } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({
      id: 1,
      local_key: 'localKey',
      specifications: {},
      properties: { dps: { 1: true } },
      thing_model: { services: [] },
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: null,
        detailsResponse: { result: { local_key: 'localKey' } },
        propertiesResponse: { result: { dps: { 1: true } } },
        modelResponse: { result: { model: '{"services":[]}' } },
        specificationError: 'spec failure',
        specifications: {},
        properties: { dps: { 1: true } },
        thingModel: { services: [] },
      }),
    });
    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.args[0]).to.match(/Failed to load specifications/);
  });

  it('should warn when details loading fails', async () => {
    const warnStub = sinon.stub(logger, 'warn');
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .resolves({ result: { details: 'specification' } })
      .onCall(1)
      .rejects(new Error('details failure'))
      .onCall(2)
      .resolves({ result: { dps: { 1: true } } })
      .onCall(3)
      .resolves({ result: { model: '{"services":[]}' } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({
      id: 1,
      specifications: { details: 'specification' },
      properties: { dps: { 1: true } },
      thing_model: { services: [] },
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: { result: { details: 'specification' } },
        detailsResponse: null,
        propertiesResponse: { result: { dps: { 1: true } } },
        modelResponse: { result: { model: '{"services":[]}' } },
        detailsError: 'details failure',
        specifications: { details: 'specification' },
        properties: { dps: { 1: true } },
        thingModel: { services: [] },
      }),
    });
    expect(warnStub.calledOnce).to.equal(true);
    expect(warnStub.firstCall.args[0]).to.match(/Failed to load details/);
  });

  it('should warn when properties and model loading fails', async () => {
    const warnStub = sinon.stub(logger, 'warn');
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .resolves({ result: { details: 'specification' } })
      .onCall(1)
      .resolves({ result: { local_key: 'localKey' } })
      .onCall(2)
      .rejects(new Error('props failure'))
      .onCall(3)
      .rejects(new Error('model failure'));

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({
      id: 1,
      local_key: 'localKey',
      specifications: { details: 'specification' },
      properties: {},
      thing_model: null,
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: { result: { details: 'specification' } },
        detailsResponse: { result: { local_key: 'localKey' } },
        propertiesResponse: null,
        modelResponse: null,
        propertiesError: 'props failure',
        modelError: 'model failure',
        specifications: { details: 'specification' },
        properties: {},
        thingModel: null,
      }),
    });
    expect(warnStub.callCount).to.equal(2);
    expect(warnStub.firstCall.args[0]).to.match(/Failed to load properties/);
    expect(warnStub.secondCall.args[0]).to.match(/Failed to load thing model/);
  });

  it('should handle invalid thing model json', async () => {
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .resolves({ result: { details: 'specification' } })
      .onCall(1)
      .resolves({ result: { local_key: 'localKey' } })
      .onCall(2)
      .resolves({ result: { dps: { 1: true } } })
      .onCall(3)
      .resolves({ result: { model: 'not-json' } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({
      id: 1,
      local_key: 'localKey',
      specifications: { details: 'specification' },
      properties: { dps: { 1: true } },
      thing_model: null,
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: { result: { details: 'specification' } },
        detailsResponse: { result: { local_key: 'localKey' } },
        propertiesResponse: { result: { dps: { 1: true } } },
        modelResponse: { result: { model: 'not-json' } },
        specifications: { details: 'specification' },
        properties: { dps: { 1: true } },
        thingModel: null,
      }),
    });
  });

  it('should keep thing model when model is an object', async () => {
    tuyaHandler.connector.request = sinon
      .stub()
      .onCall(0)
      .resolves({ result: { details: 'specification' } })
      .onCall(1)
      .resolves({ result: { local_key: 'localKey' } })
      .onCall(2)
      .resolves({ result: { dps: { 1: true } } })
      .onCall(3)
      .resolves({ result: { services: [] } });

    const device = await tuyaHandler.loadDeviceDetails({ id: 1 });

    expect(device).to.deep.eq({
      id: 1,
      local_key: 'localKey',
      specifications: { details: 'specification' },
      properties: { dps: { 1: true } },
      thing_model: { services: [] },
      tuya_report: buildExpectedReport({
        deviceId: 1,
        listEntry: { id: 1 },
        specificationResponse: { result: { details: 'specification' } },
        detailsResponse: { result: { local_key: 'localKey' } },
        propertiesResponse: { result: { dps: { 1: true } } },
        modelResponse: { result: { services: [] } },
        specifications: { details: 'specification' },
        properties: { dps: { 1: true } },
        thingModel: { services: [] },
      }),
    });
  });
});
