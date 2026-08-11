const { expect } = require('chai');

const getRoutes = require('../../api/routes');
const { buildSupervisor } = require('../lib/external-integration/testUtils.test');

describe('API routes', () => {
  it('should register the Wake-on-LAN external integration route', () => {
    const { externalIntegration } = buildSupervisor();

    const mockedGladys = {
      externalIntegration,
      service: {
        getServices: () => [],
      },
    };

    const routes = getRoutes(mockedGladys);

    const route = routes['post /api/integration/v1/network/wake'];

    expect(route).to.not.equal(undefined);
    expect(route.authenticated).to.equal(false);
    expect(route.externalIntegrationAuth).to.equal(true);
    expect(route.controller).to.be.a('function');
  });
});
