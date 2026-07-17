const sinon = require('sinon');
const { expect } = require('chai');
const { assert, fake, stub } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const logger = require('../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const adminId = 'd1d73559-a987-44eb-9453-3cbf5bcb5a2f';

describe('FreeMobileService', () => {
  let FreeMobileService;
  let axiosStub;
  let gladys;
  let freeMobileService;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axiosStub = {
      get: fake.resolves({ data: 'OK' }),
    };

    FreeMobileService = proxyquire('../../../services/free-mobile', {
      axios: axiosStub,
    });

    gladys = {
      user: {
        getByRole: fake.resolves([{ id: adminId, selector: 'john' }]),
      },
      variable: {
        getValue: fake.resolves(null),
        getVariables: fake.resolves([]),
        setValue: fake.resolves(null),
        destroy: fake.resolves(null),
      },
    };

    freeMobileService = FreeMobileService(gladys, serviceId);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('start', () => {
    it('should start service without any legacy configuration to migrate', async () => {
      await freeMobileService.start();
      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });

    it('should migrate the legacy global configuration to the admin user', async () => {
      gladys.variable.getValue = stub();
      // Global values (called without userId)
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      // Admin per-user values (not set yet)
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves(null);

      await freeMobileService.start();

      assert.calledWith(gladys.variable.setValue, 'FREE_MOBILE_USERNAME', 'legacyUser', serviceId, adminId);
      assert.calledWith(gladys.variable.setValue, 'FREE_MOBILE_ACCESS_TOKEN', 'legacyToken', serviceId, adminId);
      assert.calledWith(gladys.variable.destroy, 'FREE_MOBILE_USERNAME', serviceId);
      assert.calledWith(gladys.variable.destroy, 'FREE_MOBILE_ACCESS_TOKEN', serviceId);
    });

    it('should not migrate if no admin user is found', async () => {
      gladys.variable.getValue = stub();
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      gladys.user.getByRole = fake.resolves([]);

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });

    it('should not overwrite an existing admin per-user configuration during migration', async () => {
      gladys.variable.getValue = stub();
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves('existingUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves('existingToken');

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      // Legacy values are still removed
      assert.calledWith(gladys.variable.destroy, 'FREE_MOBILE_USERNAME', serviceId);
      assert.calledWith(gladys.variable.destroy, 'FREE_MOBILE_ACCESS_TOKEN', serviceId);
    });
  });

  describe('isUsed', () => {
    it('should return false if no user configured Free Mobile', async () => {
      gladys.variable.getVariables = fake.resolves([]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return true if at least one user configured Free Mobile', async () => {
      gladys.variable.getVariables = fake.resolves([{ user_id: adminId, value: 'validUser' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(true);
    });

    it('should return false if the variable is not user-related', async () => {
      gladys.variable.getVariables = fake.resolves([{ user_id: null, value: 'validUser' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });
  });

  describe('message.send', () => {
    it('should send SMS successfully for a user', async () => {
      gladys.variable.getValue = stub();
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves('validUsername');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves('validAccessToken');

      await freeMobileService.message.send(adminId, { text: 'Hello' });

      assert.calledWith(axiosStub.get, 'https://smsapi.free-mobile.fr/sendmsg', {
        params: {
          user: 'validUsername',
          pass: 'validAccessToken',
          msg: 'Hello',
        },
      });
    });

    it('should not send SMS if the user has no configuration', async () => {
      gladys.variable.getValue = fake.resolves(null);
      await freeMobileService.message.send(adminId, { text: 'Hello' });
      assert.notCalled(axiosStub.get);
    });

    it('should throw and log an error if SMS fails', async () => {
      gladys.variable.getValue = stub();
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves('validUsername');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves('validAccessToken');
      axiosStub.get = fake.rejects(new Error('Network error'));
      const loggerErrorStub = sandbox.stub(logger, 'error');

      try {
        await freeMobileService.message.send(adminId, { text: 'Hello World' });
        throw new Error('Expected an error to be thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
        expect(e.message).to.equal('Network error');
      }
      const errorArgs = loggerErrorStub.getCall(0).args;
      expect(errorArgs[0]).to.equal('Error sending SMS:');
    });
  });

  describe('stop', () => {
    it('should stop service', async () => {
      await freeMobileService.stop();
    });
  });
});
