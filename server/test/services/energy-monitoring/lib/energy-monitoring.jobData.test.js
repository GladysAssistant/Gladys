const { expect } = require('chai');
const sinon = require('sinon');
const {
  buildJobDataForConsumption,
  buildJobDataForCost,
} = require('../../../../services/energy-monitoring/lib/energy-monitoring.jobData');

describe('energy-monitoring.jobData', () => {
  const baseTimezone = 'Europe/Paris';
  const fakeStateManager = {
    get: sinon.stub(),
  };

  const energyFeature = {
    id: 'energy-id',
    selector: 'energy-selector',
    external_id: 'energy-ext',
    name: 'Energy root',
    device_id: 'device-id',
  };
  const consumptionFeature = {
    id: 'consumption-id',
    selector: 'consumption-selector',
    external_id: 'consumption-ext',
    name: 'Consumption',
    device_id: 'device-id',
    energy_parent_id: 'energy-id',
  };
  const costFeature = {
    id: 'cost-id',
    selector: 'cost-selector',
    external_id: 'cost-ext',
    name: 'Cost',
    device_id: 'device-id',
    energy_parent_id: 'consumption-id',
  };
  const device = {
    id: 'device-id',
    name: 'My Energy Device',
  };

  beforeEach(() => {
    fakeStateManager.get.resetHistory();
    fakeStateManager.get.withArgs('deviceFeature', 'energy-selector').returns(energyFeature);
    fakeStateManager.get.withArgs('deviceFeatureByExternalId', 'energy-selector').returns(energyFeature);
    fakeStateManager.get.withArgs('deviceFeature', 'consumption-selector').returns(consumptionFeature);
    fakeStateManager.get.withArgs('deviceFeatureByExternalId', 'consumption-selector').returns(consumptionFeature);
    fakeStateManager.get.withArgs('deviceFeature', 'cost-selector').returns(costFeature);
    fakeStateManager.get.withArgs('deviceFeatureByExternalId', 'cost-selector').returns(costFeature);
    fakeStateManager.get.withArgs('deviceById', 'device-id').returns(device);
  });

  it('should build job data for consumption with period and devices', async () => {
    const ctx = {
      gladys: { stateManager: fakeStateManager, variable: { getValue: sinon.stub().resolves(baseTimezone) } },
    };
    const result = await buildJobDataForConsumption.call(
      ctx,
      '2025-01-01',
      ['energy-selector', 'consumption-selector'],
      '2025-01-31',
    );
    expect(result).to.have.property('scope', 'selection');
    expect(result)
      .to.have.nested.property('period.start_date')
      .that.is.a('string');
    expect(result)
      .to.have.nested.property('period.end_date')
      .that.is.a('string');
    expect(result.devices).to.deep.equal([{ device: 'My Energy Device', features: ['Consumption', 'Energy root'] }]);
    expect(result).to.have.property('kind', 'consumption');
  });

  it('should support legacy startAt array without period', async () => {
    const ctx = {
      gladys: { stateManager: fakeStateManager, variable: { getValue: sinon.stub().resolves(baseTimezone) } },
    };
    const result = await buildJobDataForCost.call(ctx, ['cost-selector', 'energy-selector']);
    expect(result).to.include({ scope: 'selection', kind: 'cost' });
    expect(result).to.not.have.property('period');
    expect(result.devices[0].features).to.include('Cost');
  });

  it('should return empty object when buildJobData fails (consumption)', async () => {
    const ctx = {
      buildJobData() {
        throw new Error('boom');
      },
    };
    const res = await buildJobDataForConsumption.call(ctx, null, null, null);
    expect(res).to.deep.equal({ scope: 'all' });
  });

  it('should return empty object when buildJobData fails (cost)', async () => {
    const ctx = {
      buildJobData() {
        throw new Error('boom');
      },
    };
    const res = await buildJobDataForCost.call(ctx, null, null, null);
    expect(res).to.deep.equal({ scope: 'all' });
  });

  it('should normalize args when startAt is an object with selectors and period', async () => {
    const ctx = {
      gladys: { stateManager: fakeStateManager, variable: { getValue: sinon.stub().resolves(baseTimezone) } },
    };
    const startAt = {
      start_date: '2025-03-01',
      end_date: '2025-03-15',
      featureSelectors: ['consumption-selector'],
    };
    const res = await buildJobDataForConsumption.call(ctx, startAt, ['ignored-selector'], null);
    expect(res.scope).to.equal('selection');
    expect(res.kind).to.equal('consumption');
    expect(res.period).to.deep.equal({ start_date: '2025-03-01', end_date: '2025-03-15' });
    expect(res.devices[0].features).to.deep.equal(['Consumption']);
  });

  it('should handle array startAt legacy with mixed selectors', async () => {
    const ctx = {
      gladys: { stateManager: fakeStateManager, variable: { getValue: sinon.stub().resolves(baseTimezone) } },
    };
    const res = await buildJobDataForConsumption.call(ctx, ['consumption-selector'], ['energy-selector'], null);
    expect(res.scope).to.equal('selection');
    expect(res.period || null).to.equal(null);
    expect(res.devices[0].features).to.include('Consumption');
  });

  it('should return scope all when selectors cannot be resolved', async () => {
    const ctx = {
      gladys: { stateManager: fakeStateManager, variable: { getValue: sinon.stub().resolves(baseTimezone) } },
    };
    const res = await buildJobDataForCost.call(ctx, {}, ['unknown-selector'], {});
    expect(res).to.deep.equal({ scope: 'all' });
  });
});
