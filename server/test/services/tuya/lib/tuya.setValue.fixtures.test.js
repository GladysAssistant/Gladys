const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire')
  .noCallThru()
  .noPreserveCache();

const { loadFixtureCases } = require('../fixtures/fixtureHelper');

describe('TuyaHandler.setValue fixtures', () => {
  const fixtureCases = loadFixtureCases('setValueLocal');

  it('should load at least one setValue fixture case', () => {
    expect(fixtureCases.length).to.be.greaterThan(0);
  });

  fixtureCases.forEach((fixtureCase) => {
    it(`should set local value for ${fixtureCase.manifest.name} from fixture`, async () => {
      const connect = sinon.stub().resolves();
      const set = sinon.stub().resolves();
      const disconnect = sinon.stub().resolves();

      /**
       * @description Simple TuyAPI test double used for fixture-driven local setValue tests.
       * @example
       * new TuyAPIStub();
       */
      function TuyAPIStub() {
        this.connect = connect;
        this.set = set;
        this.disconnect = disconnect;
      }

      const { setValue } = proxyquire('../../../../services/tuya/lib/tuya.setValue', {
        tuyapi: TuyAPIStub,
        '@demirdeniz/tuyapi-newgen': function TuyAPINewGenStub() {},
      });

      const {
        device,
        featureExternalId,
        inputValue,
        expectedLocalSet,
        expectedCloudRequests = 0,
      } = fixtureCase.manifest.setValueLocal;

      const currentDevice = fixtureCase.load(device);
      const currentFeature = currentDevice.features.find((feature) => feature.external_id === featureExternalId);
      const ctx = {
        connector: { request: sinon.stub().resolves({}) },
        gladys: {},
      };

      await setValue.call(ctx, currentDevice, currentFeature, inputValue);

      expect(connect.calledOnce).to.equal(true);
      expect(set.calledOnce).to.equal(true);
      expect(disconnect.calledOnce).to.equal(true);
      expect(set.firstCall.args[0]).to.deep.equal(expectedLocalSet);
      expect(ctx.connector.request.callCount).to.equal(expectedCloudRequests);
    });
  });
});
