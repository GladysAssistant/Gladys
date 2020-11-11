const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId, event } = require('../../mocks/consts.test');
const EweLinkApi = require('../../mocks/ewelink-api.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApi,
});

describe('EweLinkHandler throwErrorIfNeeded', () => {
  const gladys = { event };
  const eweLinkService = EwelinkService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'validAccessToken';
    eweLinkService.device.apiKey = 'validApiKey';
  });

  it('should throws a error and not emit a message', async () => {
    try {
      const response = { error: 406, msg: 'Authentication error' };
      await eweLinkService.device.throwErrorIfNeeded(response);
      assert.fail();
    } catch (error) {
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
  it('should throws an error and emit a message', async () => {
    try {
      const response = { error: 406, msg: 'Authentication error' };
      await eweLinkService.device.throwErrorIfNeeded(response, true);
      assert.fail();
    } catch (error) {
      assert.calledOnceWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'ewelink.error',
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
  it('should reset authentication values when authentication fail', async () => {
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      const response = { error: 406, msg: 'Authentication error' };
      await eweLinkService.device.throwErrorIfNeeded(response);
      assert.fail();
    } catch (error) {
      expect(eweLinkService.device.connected).to.equal(false);
      expect(eweLinkService.device.accessToken).to.equal('');
      expect(eweLinkService.device.apiKey).to.equal('');
    }
  });
  it('should throws a error and not emit a message', async () => {
    try {
      const response = { error: 404, msg: 'Device does not exist' };
      await eweLinkService.device.throwErrorIfNeeded(response);
      assert.fail();
    } catch (error) {
      expect(error.status).to.equal(500);
      expect(error.error).to.equal('eWeLink: Device does not exist');
    }
  });
  it('should throws an error and emit a message', async () => {
    try {
      const response = { error: 404, msg: 'Device does not exist' };
      await eweLinkService.device.throwErrorIfNeeded(response, true);
      assert.fail();
    } catch (error) {
      assert.calledOnceWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'ewelink.error',
        payload: 'Device does not exist',
      });
      expect(error.status).to.equal(500);
      expect(error.error).to.equal('eWeLink: Device does not exist');
    }
  });
  it('should not reset authentication values', async () => {
    try {
      const response = { error: 500, msg: 'Device does not exist' };
      await eweLinkService.device.throwErrorIfNeeded(response);
      assert.fail();
    } catch (error) {
      expect(eweLinkService.device.connected).to.equal(true);
      expect(eweLinkService.device.accessToken).to.equal('validAccessToken');
      expect(eweLinkService.device.apiKey).to.equal('validApiKey');
    }
  });
});
