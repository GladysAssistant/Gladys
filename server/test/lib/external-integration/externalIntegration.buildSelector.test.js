const { expect } = require('chai');

const db = require('../../../models');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

describe('externalIntegration.buildSelector', () => {
  let externalIntegration;

  beforeEach(() => {
    ({ externalIntegration } = buildSupervisor());
  });

  it('should build a selector from a store slug', async () => {
    const selector = await externalIntegration.buildSelector({ storeSlug: 'john/gladys-open-meteo-demo' });
    expect(selector).to.equal('ext-john-gladys-open-meteo-demo');
  });

  it('should build a dev selector from the manifest name', async () => {
    const selector = await externalIntegration.buildSelector({ manifestName: 'Open-Meteo Demo' });
    expect(selector).to.equal('ext-dev-open-meteo-demo');
  });

  it('should suffix the dev selector on collision', async () => {
    await seedExternalService();
    const selector = await externalIntegration.buildSelector({ manifestName: 'Open-Meteo Demo' });
    expect(selector).to.equal('ext-dev-open-meteo-demo-2');
    await db.Service.create({
      name: 'ext-dev-open-meteo-demo-2',
      selector: 'ext-dev-open-meteo-demo-2',
      version: '1.0.0',
      type: 'external',
    });
    const thirdSelector = await externalIntegration.buildSelector({ manifestName: 'Open-Meteo Demo' });
    expect(thirdSelector).to.equal('ext-dev-open-meteo-demo-3');
  });
});
