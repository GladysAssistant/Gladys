const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake, stub } = sinon;

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const adminId = 'd1d73559-a987-44eb-9453-3cbf5bcb5a2f';

describe('FreeMobileService', () => {
  let FreeMobileService;
  let axiosStub;
  let gladys;
  let freeMobileService;

  beforeEach(() => {
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

    it('should not migrate an incomplete legacy configuration (username only)', async () => {
      gladys.variable.getValue = stub().resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves(null);

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });

    it('should not migrate an incomplete legacy configuration (token only)', async () => {
      gladys.variable.getValue = stub().resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves(null);

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });

    it('should keep the legacy configuration when the admin has a partial configuration (username only)', async () => {
      gladys.variable.getValue = stub().resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves('existingUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves(null);

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });

    it('should keep the legacy configuration when the admin has a partial configuration (token only)', async () => {
      gladys.variable.getValue = stub().resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId).resolves('legacyUser');
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves('legacyToken');
      gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, adminId).resolves(null);
      gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, adminId).resolves('existingToken');

      await freeMobileService.start();

      assert.notCalled(gladys.variable.setValue);
      assert.notCalled(gladys.variable.destroy);
    });
  });

  describe('isUsed', () => {
    it('should return false if no user configured Free Mobile', async () => {
      gladys.variable.getVariables = fake.resolves([]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return true if at least one user configured both username and token', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: adminId, value: 'validUser' }]);
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId)
        .resolves([{ user_id: adminId, value: 'validToken' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(true);
    });

    it('should return false if the variable is not user-related', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: null, value: 'validUser' }]);
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId)
        .resolves([{ user_id: null, value: 'validToken' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return false if the username is empty', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: adminId, value: '' }]);
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId)
        .resolves([{ user_id: adminId, value: 'validToken' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return false if the user has a username but no token', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: adminId, value: 'validUser' }]);
      gladys.variable.getVariables.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId).resolves([]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return false if the user has a username but an empty token', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: adminId, value: 'validUser' }]);
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId)
        .resolves([{ user_id: adminId, value: '' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });

    it('should return false if the username and the token belong to different users', async () => {
      gladys.variable.getVariables = stub();
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_USERNAME', serviceId)
        .resolves([{ user_id: adminId, value: 'validUser' }]);
      gladys.variable.getVariables
        .withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId)
        .resolves([{ user_id: 'another-user-id', value: 'validToken' }]);
      const used = await freeMobileService.isUsed();
      expect(used).to.equal(false);
    });
  });

  describe('stop', () => {
    it('should stop service', async () => {
      await freeMobileService.stop();
    });
  });
});
