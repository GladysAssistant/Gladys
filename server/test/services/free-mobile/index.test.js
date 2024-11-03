const sinon = require('sinon');
const { expect } = require('chai');

const axios = require('axios');
const logger = require('../../../utils/logger');
const FreeMobileService = require('../../../services/free-mobile');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('free-mobile', () => {
  let gladys;
  let freeMobileService;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: sinon.stub(),
      },
    };
    freeMobileService = FreeMobileService(gladys, serviceId);
  });

  describe('start', () => {
    it('should throw ServiceNotConfiguredError if username is missing', async () => {
      gladys.variable.getValue.resolves(null);

      try {
        await freeMobileService.start();
        throw new Error('Expected ServiceNotConfiguredError to be thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(ServiceNotConfiguredError);
      }
    });

    it('should throw ServiceNotConfiguredError if accessToken is missing', async () => {
      gladys.variable.getValue
        .onFirstCall()
        .resolves('validUsername')
        .onSecondCall()
        .resolves(null);

      try {
        await freeMobileService.start();
        throw new Error('Expected ServiceNotConfiguredError to be thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(ServiceNotConfiguredError);
      }
    });
  });

  describe('send', () => {
    it('should send SMS successfully', async () => {
      gladys.variable.getValue
        .onFirstCall()
        .resolves('validUsername')
        .onSecondCall()
        .resolves('validAccessToken');

      const axiosPostStub = sinon.stub(axios, 'post').resolves({ data: 'success' });

      await freeMobileService.start();
      await freeMobileService.sms.send('Hello World');

      const callArgs = axiosPostStub.getCall(0).args;
      expect(callArgs[0]).to.equal('https://smsapi.free-mobile.fr/sendmsg');
      expect(callArgs[1]).to.deep.equal({
        user: 'validUsername',
        pass: 'validAccessToken',
        msg: 'Hello World',
      });

      axiosPostStub.restore();
    });

    it('should log an error if SMS fails', async () => {
      gladys.variable.getValue
        .onFirstCall()
        .resolves('validUsername')
        .onSecondCall()
        .resolves('validAccessToken');

      const axiosPostStub = sinon.stub(axios, 'post').rejects(new Error('Network error'));
      const loggerErrorStub = sinon.stub(logger, 'error');

      await freeMobileService.start();
      await freeMobileService.sms.send('Hello World');

      const errorArgs = loggerErrorStub.getCall(0).args;
      expect(errorArgs[0]).to.equal('Error sending SMS:');
      expect(errorArgs[1]).to.be.instanceOf(Error);

      axiosPostStub.restore();
      loggerErrorStub.restore();
    });
  });

  describe('stop', () => {
    it('should stopping service', async () => {
      await freeMobileService.stop();
    });
  });
});
