const { expect } = require('chai');
const {
  getBreakdownTotalExternalId,
  findBreakdownTotal,
  attachBreakdownIndexes,
} = require('../../../../services/energy-monitoring/utils/energyBreakdown');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const energyIndex = (id, property, energyParentId, deviceName = 'meter') => ({
  id,
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
  type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
  external_id: `zigbee2mqtt:${deviceName}:switch:energy:${property}`,
  energy_parent_id: energyParentId,
});

describe('getBreakdownTotalExternalId', () => {
  it('should give the external_id of the total of a phase', () => {
    expect(getBreakdownTotalExternalId('zigbee2mqtt:meter:switch:energy:energy_a')).to.equal(
      'zigbee2mqtt:meter:switch:energy:energy',
    );
    expect(getBreakdownTotalExternalId('zigbee2mqtt:meter:energy-production-sensor:index:energy_produced_c')).to.equal(
      'zigbee2mqtt:meter:energy-production-sensor:index:produced_energy',
    );
  });
  it('should read the property from the end when the device name has a colon', () => {
    expect(getBreakdownTotalExternalId('zigbee2mqtt:panel:garage:switch:energy:energy_b')).to.equal(
      'zigbee2mqtt:panel:garage:switch:energy:energy',
    );
  });
  it('should keep the numeric suffix of a feature', () => {
    expect(getBreakdownTotalExternalId('zigbee2mqtt:meter:switch:energy:energy_a:1')).to.equal(
      'zigbee2mqtt:meter:switch:energy:energy:1',
    );
  });
  it('should return null for a feature that is not a breakdown index', () => {
    expect(getBreakdownTotalExternalId('zigbee2mqtt:meter:switch:energy:energy')).to.equal(null);
    expect(getBreakdownTotalExternalId('zigbee2mqtt:meter:switch:energy:constructor')).to.equal(null);
    expect(getBreakdownTotalExternalId('matter:meter:switch:energy:energy_a')).to.equal(null);
    expect(getBreakdownTotalExternalId(undefined)).to.equal(null);
  });
});

describe('findBreakdownTotal', () => {
  it('should find the total of the same category and type on the device', () => {
    const total = energyIndex('energy', 'energy', 'main-meter');
    const phase = energyIndex('energy-a', 'energy_a', 'main-meter');
    const device = { features: [total, phase] };
    expect(findBreakdownTotal(device, phase)).to.equal(total);
    expect(findBreakdownTotal(device, total)).to.equal(null);
  });
  it('should return null when the device has no total', () => {
    const phase = energyIndex('energy-a', 'energy_a', 'main-meter');
    expect(findBreakdownTotal({ features: [phase] }, phase)).to.equal(null);
  });
});

describe('attachBreakdownIndexes', () => {
  it('should hang the phases under their total and report the changes', () => {
    const total = energyIndex('energy', 'energy', 'main-meter');
    const phaseA = energyIndex('energy-a', 'energy_a', 'main-meter');
    const phaseB = energyIndex('energy-b', 'energy_b', 'energy');
    const power = { category: DEVICE_FEATURE_CATEGORIES.SWITCH, type: DEVICE_FEATURE_TYPES.SWITCH.POWER };
    const changes = attachBreakdownIndexes({ features: [power, total, phaseA, phaseB] });
    expect(changes).to.deep.equal([{ feature: phaseA, previousParentId: 'main-meter' }]);
    expect(phaseA.energy_parent_id).to.equal('energy');
    expect(phaseB.energy_parent_id).to.equal('energy');
    // a total with no parent stays a root, a feature without id is no one's parent
    const root = energyIndex('energy', 'energy', undefined);
    attachBreakdownIndexes({ features: [power, root, energyIndex('energy-a', 'energy_a', undefined)] });
    expect(root.energy_parent_id).to.equal(undefined);
  });
  it('should make the total a root when it hangs under its phase, the root of the main meter', () => {
    // the SPM02V3 is the main meter and its phase A was its root feature
    const total = energyIndex('energy', 'energy', 'energy-a');
    const phaseA = energyIndex('energy-a', 'energy_a', null);
    const phaseB = energyIndex('energy-b', 'energy_b', 'energy-a');
    const changes = attachBreakdownIndexes({ features: [total, phaseA, phaseB] });
    expect(total.energy_parent_id).to.equal(null);
    expect(phaseA.energy_parent_id).to.equal('energy');
    expect(phaseB.energy_parent_id).to.equal('energy');
    expect(changes).to.have.lengthOf(3);
  });
  it('should give the total the meter its phase was on', () => {
    const total = energyIndex('energy', 'energy', 'energy-a');
    const phaseA = energyIndex('energy-a', 'energy_a', 'main-meter');
    attachBreakdownIndexes({ features: [total, phaseA] });
    expect(total.energy_parent_id).to.equal('main-meter');
    expect(phaseA.energy_parent_id).to.equal('energy');
  });
  it('should make the total a root when its phase hangs on the device too', () => {
    const power = { id: 'power', category: DEVICE_FEATURE_CATEGORIES.SWITCH, type: DEVICE_FEATURE_TYPES.SWITCH.POWER };
    const total = energyIndex('energy', 'energy', 'energy-a');
    const phaseA = energyIndex('energy-a', 'energy_a', 'power');
    attachBreakdownIndexes({ features: [power, total, phaseA] });
    expect(total.energy_parent_id).to.equal(null);
    expect(phaseA.energy_parent_id).to.equal('energy');
  });
});
