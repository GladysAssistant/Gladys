const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../../utils/constants');
const { loadFixtureCases, normalizeEvents, sortByKey } = require('../fixtures/fixtureHelper');
const { poll: pollCloud } = require('../../../../services/tuya/lib/tuya.poll');

const createGladysContext = () => ({
  event: {
    emit: sinon.stub(),
  },
});

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
  });
});
