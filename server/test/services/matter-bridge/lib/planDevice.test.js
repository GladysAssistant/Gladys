const { expect } = require('chai');

const { planDevice, planSignature } = require('../../../../services/matter-bridge/lib/planDevice');
const { feature } = require('../fakes');

describe('Matter bridge planDevice', () => {
  const binary = feature('light-binary', 'light', 'binary');
  const temperature = feature('temperature', 'temperature-sensor', 'decimal');
  const level = feature('battery', 'battery', 'integer');

  it('should plan the functions and battery of a device', () => {
    const plan = planDevice({ features: [binary, temperature, level, feature('x', 'unknown', 'decimal')] });
    expect(plan.functions.map(({ adapter, roles }) => [adapter.key, roles])).to.deep.equal([
      ['light', { binary }],
      ['temperature', { value: temperature }],
    ]);
    expect(plan.battery.adapter.key).to.equal('battery');
    expect(plan.battery.roles).to.deep.equal({ level });
  });

  it('should plan a device without battery', () => {
    expect(planDevice({ features: [binary] }).battery).to.equal(null);
  });

  it('should not plan a device with nothing to expose, battery alone included', () => {
    expect(planDevice({ features: [level] })).to.equal(null);
    expect(planDevice({})).to.equal(null);
  });

  it('should not plan the network presence of a phone, Bluetooth or LAN', () => {
    expect(planDevice({ features: [feature('phone', 'presence-sensor', 'push')] })).to.equal(null);
  });

  it('should never give a feature to two adapters', () => {
    const greedy = { key: 'greedy', claim: (features) => features.map((f) => ({ value: f })) };
    const plan = planDevice({ features: [binary, temperature] }, [greedy, greedy]);
    expect(plan.functions.map(({ roles }) => roles)).to.deep.equal([{ value: binary }, { value: temperature }]);
  });

  it('should sign what requires the endpoints to be rebuilt', () => {
    const device = { selector: 'd', name: 'A', features: [binary, level] };
    const signature = planSignature(device, planDevice(device));
    const renamed = { ...device, name: 'B' };
    expect(planSignature(renamed, planDevice(renamed))).to.equal(signature);
    const changed = { ...device, features: [{ ...binary, max: 255 }, level] };
    expect(planSignature(changed, planDevice(changed))).to.not.equal(signature);
    const otherModel = { ...device, model: 'Other model' };
    expect(planSignature(otherModel, planDevice(otherModel))).to.not.equal(signature);
    const withoutBattery = { ...device, features: [binary] };
    expect(planSignature(withoutBattery, planDevice(withoutBattery))).to.not.equal(signature);
  });
});
