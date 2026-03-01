const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../../utils/constants');
const { loadFixtureCases, normalizeEvents, sortByKey } = require('../fixtures/fixtureHelper');
const { poll: pollCloud } = require('../../../../services/tuya/lib/tuya.poll');
const { getLocalDpsFromCode } = require('../../../../services/tuya/lib/device/tuya.localMapping');

const createGladysContext = () => ({
  event: {
    emit: sinon.stub(),
  },
});

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const getFeatureCode = (feature) => {
  if (!feature || !feature.external_id) {
    return null;
  }
  return String(feature.external_id)
    .split(':')
    .pop();
};

const forceCloudMode = (device) => ({
  ...device,
  params: (Array.isArray(device.params) ? device.params : []).map((param) =>
    param.name === 'LOCAL_OVERRIDE' ? { ...param, value: false } : param,
  ),
});

describe('TuyaHandler.poll fixtures', () => {
  const cloudCases = loadFixtureCases('pollCloud');
  const localCases = loadFixtureCases('pollLocal');

  cloudCases.forEach((fixtureCase) => {
    it(`should poll cloud values for ${fixtureCase.manifest.name} from fixture`, async () => {
      const { device, response, expectedEvents } = fixtureCase.manifest.pollCloud;
      const connector = {
        request: sinon.stub().resolves(fixtureCase.load(response)),
      };
      const gladys = createGladysContext();
      const cloudDevice = forceCloudMode(fixtureCase.load(device));

      await pollCloud.call(
        {
          connector,
          gladys,
        },
        cloudDevice,
      );
      const emittedEvents = gladys.event.emit.getCalls().filter((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
      expect(normalizeEvents(emittedEvents)).to.deep.equal(sortByKey(fixtureCase.load(expectedEvents)));
    });
  });

  localCases.forEach((fixtureCase) => {
    it(`should poll local values for ${fixtureCase.manifest.name} from fixture`, async () => {
      const { device, dps, expectedEvents, expectedCloudRequests = 0 } = fixtureCase.manifest.pollLocal;
      const localPoll = sinon.stub().resolves({ dps: fixtureCase.load(dps) });
      const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
        './tuya.localPoll': { localPoll },
      });
      const connector = {
        request: sinon.stub().resolves({ result: [] }),
      };
      const gladys = createGladysContext();

      await poll.call(
        {
          connector,
          gladys,
        },
        fixtureCase.load(device),
      );
      const emittedEvents = gladys.event.emit.getCalls().filter((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
      expect(normalizeEvents(emittedEvents)).to.deep.equal(sortByKey(fixtureCase.load(expectedEvents)));
      expect(connector.request.callCount).to.equal(expectedCloudRequests);
    });

    it(`should not emit a feature state when its local dps is missing for ${fixtureCase.manifest.name}`, async () => {
      const { device, dps } = fixtureCase.manifest.pollLocal;
      const currentDevice = fixtureCase.load(device);
      const currentDps = fixtureCase.load(dps);
      const removableFeature = (Array.isArray(currentDevice.features) ? currentDevice.features : [])
        .map((feature) => {
          const code = getFeatureCode(feature);
          const dpsKey = getLocalDpsFromCode(code, currentDevice);
          return {
            feature,
            code,
            dpsKey,
          };
        })
        .find(({ dpsKey }) => dpsKey !== null && Object.prototype.hasOwnProperty.call(currentDps, String(dpsKey)));

      expect(removableFeature, 'fixture should expose at least one locally mapped dps').to.not.equal(undefined);

      const degradedDps = cloneDeep(currentDps);
      delete degradedDps[String(removableFeature.dpsKey)];

      const localPoll = sinon.stub().resolves({ dps: degradedDps });
      const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
        './tuya.localPoll': { localPoll },
      });
      const connector = {
        request: sinon.stub().resolves({ result: [] }),
      };
      const gladys = createGladysContext();

      await poll.call(
        {
          connector,
          gladys,
        },
        currentDevice,
      );

      const emittedEvents = gladys.event.emit.getCalls().filter((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
      const emittedFeatureIds = emittedEvents.map((call) => call.args[1].device_feature_external_id);

      expect(emittedFeatureIds).to.not.include(removableFeature.feature.external_id);
    });
  });
});
