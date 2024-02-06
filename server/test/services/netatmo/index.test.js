const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const { NetatmoHandlerMock } = require('./netatmo.mock.test');
const { STATUS } = require('../../../services/netatmo/lib/utils/netatmo.constants');

describe('Netatmo Service', () => {
  let NetatmoService;
  let netatmoService;
  let gladys;
  let serviceId;

  beforeEach(() => {
    gladys = { service: { getService: sinon.stub() } };
    serviceId = 'some-service-id';

    NetatmoService = proxyquire('../../../services/netatmo/index', {
      './lib': function mockFunction() {
        return NetatmoHandlerMock;
      },
    });

    netatmoService = NetatmoService(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('start', () => {
    it('should start the service correctly', async () => {
      await netatmoService.start();
      expect(NetatmoHandlerMock.init.calledOnce).to.equal(true);
    });
  });

  describe('stop', () => {
    it('should stop the service correctly', async () => {
      await netatmoService.stop();
      expect(NetatmoHandlerMock.disconnect.calledOnce).to.equal(true);
    });
  });

  describe('isUsed', () => {
    it('should return true when Netatmo is connected', async () => {
      NetatmoHandlerMock.status = STATUS.CONNECTED;
      const result = await netatmoService.isUsed();
      expect(result).to.equal(true);
    });

    it('should return false when Netatmo is not connected', async () => {
      NetatmoHandlerMock.status = STATUS.NOT_INITIALIZED;
      const result = await netatmoService.isUsed();
      expect(result).to.equal(false);
    });
  });
});
