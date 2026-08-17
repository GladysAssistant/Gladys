const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert } = sinon;

const { EVENTS } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_WEATHER_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.handleWeatherRefresh', () => {
  it('should relaunch the alert and the weather trigger checks on a nudge from a weather integration', async () => {
    const { externalIntegration, event } = buildSupervisor();
    const service = await seedExternalService({ manifest: TEST_WEATHER_MANIFEST });
    externalIntegration.handleWeatherRefresh(service);
    sinonAssert.calledWith(event.emit, EVENTS.WEATHER.CHECK_ALERTS);
    sinonAssert.calledWith(event.emit, EVENTS.WEATHER.CHECK_TRIGGERS);
  });

  it('should rate-limit nudges to one per minute per integration', async () => {
    const { externalIntegration, event } = buildSupervisor();
    const service = await seedExternalService({ manifest: TEST_WEATHER_MANIFEST });
    // an accepted nudge relaunches both gated checks
    externalIntegration.handleWeatherRefresh(service);
    externalIntegration.handleWeatherRefresh(service);
    expect(event.emit.callCount).to.equal(2);
    // a nudge older than the window is accepted again
    externalIntegration.weatherRefreshTimes.set(service.id, Date.now() - 61 * 1000);
    externalIntegration.handleWeatherRefresh(service);
    expect(event.emit.callCount).to.equal(4);
  });

  it('should silently ignore a nudge from a non-weather integration', async () => {
    const { externalIntegration, event } = buildSupervisor();
    const service = await seedExternalService();
    externalIntegration.handleWeatherRefresh(service);
    expect(event.emit.callCount).to.equal(0);
  });
});
