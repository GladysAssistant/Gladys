const sinon = require('sinon');
const { expect } = require('chai');
const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru();
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('FreeMobileService', () => {
  let FreeMobileService;
  let axiosStub;
  let gladys;
  let freeMobileService;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axiosStub = {
      get: async () => {
        return { data: 'OK' };
      },
    };

    FreeMobileService = proxyquire('../../../services/free-mobile', {
      axios: axiosStub,
    });

    gladys = {
      variable: {
        getValue: async (key) => {
          if (key === 'FREE_MOBILE_USERNAME') {
            return 'validUsername';
          }
          if (key === 'FREE_MOBILE_ACCESS_TOKEN') {
            return 'validAccessToken';
          }
          return null;
        },
      },
    };

    freeMobileService = FreeMobileService(gladys, serviceId);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('start', () => {
    it('should start service with success', async () => {
      await freeMobileService.start();

      assert.strictEqual(await gladys.variable.getValue('FREE_MOBILE_USERNAME', serviceId), 'validUsername');
      assert.strictEqual(await gladys.variable.getValue('FREE_MOBILE_ACCESS_TOKEN', serviceId), 'validAccessToken');
    });

    it('should throw ServiceNotConfiguredError if username is missing', async () => {
      gladys.variable.getValue = async (key) => {
        if (key === 'FREE_MOBILE_USERNAME') {
          return null;
        }
        if (key === 'FREE_MOBILE_ACCESS_TOKEN') {
          return 'validAccessToken';
        }
        return null;
      };

      try {
        await freeMobileService.start();
        throw new Error('Expected ServiceNotConfiguredError to be thrown');
      } catch (e) {
        expect(e).instanceOf(ServiceNotConfiguredError);
      }
    });

    it('should throw ServiceNotConfiguredError if accessToken is missing', async () => {
      gladys.variable.getValue = async (key) => {
        if (key === 'FREE_MOBILE_USERNAME') {
          return 'validUsername';
        }
        if (key === 'FREE_MOBILE_ACCESS_TOKEN') {
          return null;
        }
        return null;
      };

      try {
        await freeMobileService.start();
        throw new Error('Expected ServiceNotConfiguredError to be thrown');
      } catch (e) {
        expect(e).instanceOf(ServiceNotConfiguredError);
      }
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await freeMobileService.start();
    });

    it('should send SMS successfully', async () => {
      axiosStub.get = async (url, options) => {
        assert.strictEqual(url, 'https://smsapi.free-mobile.fr/sendmsg');
        assert.deepStrictEqual(options.params, {
          user: 'validUsername',
          pass: 'validAccessToken',
          msg: 'Hello',
        });
        return { data: 'OK' };
      };

      await freeMobileService.sms.send('Hello');
    });

    it('should log an error if SMS fails', async () => {
      axiosStub.get = async () => {
        throw new Error('Network error');
      };
      const loggerErrorStub = sandbox.stub(logger, 'error');
      await freeMobileService.sms.send('Hello World');
      const errorArgs = loggerErrorStub.getCall(0).args;
      expect(errorArgs[0]).to.equal('Error sending SMS:');
      expect(errorArgs[1]).to.be.instanceOf(Error);
    });
  });

  describe('stop', () => {
    it('should stopping service', async () => {
      await freeMobileService.stop();
    });
  });
});
