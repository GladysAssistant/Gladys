const EventEmitter = require('events');
const { expect, assert } = require('chai');
const { fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const db = require('../../../models');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.updateFeature', () => {
  let device;
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(event);
    // Spy on setState to ensure it is called after successful update
    stateManager.setState = fake.bind(stateManager, stateManager.setState);
    const service = { getLocalServiceByName: fake.resolves({ id: 'service-id' }) };
    device = new Device(event, {}, stateManager, service, {}, {}, job);
  });

  it('should return existing feature when nothing to update', async () => {
    const selector = 'test-device-feature';
    const featureBefore = await db.DeviceFeature.findOne({ where: { selector } });
    expect(featureBefore).to.not.equal(null);

    const res = await device.updateFeature(selector, {});
    expect(res).to.have.property('selector', selector);
    // ensure DB not changed for energy_parent_id
    const featureAfter = await db.DeviceFeature.findOne({ where: { selector } });
    expect(featureAfter.energy_parent_id).to.equal(featureBefore.energy_parent_id);
  });

  it('should update energy_parent_id and update state', async () => {
    const parentSelector = 'test-device-feature-2';
    const childSelector = 'test-device-feature';

    const parent = await db.DeviceFeature.findOne({ where: { selector: parentSelector } });
    const child = await db.DeviceFeature.findOne({ where: { selector: childSelector } });
    expect(parent).to.not.equal(null);
    expect(child).to.not.equal(null);

    // make sure parent has no parent to avoid accidental circular refs
    await db.DeviceFeature.update({ energy_parent_id: null }, { where: { id: parent.id } });

    const updated = await device.updateFeature(childSelector, { energy_parent_id: parent.id });
    expect(updated).to.have.property('energy_parent_id', parent.id);

    const reloaded = await db.DeviceFeature.findOne({ where: { selector: childSelector } });
    expect(reloaded.energy_parent_id).to.equal(parent.id);
  });

  it('should prevent circular energy_parent_id', async () => {
    const aSelector = 'test-device-feature';
    const bSelector = 'test-device-feature-2';

    const a = await db.DeviceFeature.findOne({ where: { selector: aSelector } });
    const b = await db.DeviceFeature.findOne({ where: { selector: bSelector } });

    // Create A <- B relation (B parent is A)
    await db.DeviceFeature.update({ energy_parent_id: a.id }, { where: { id: b.id } });

    // Now try to set A's parent to B, creating a cycle
    const promise = device.updateFeature(aSelector, { energy_parent_id: b.id });
    await assert.isRejected(promise, 'Circular energy_parent_id not allowed');
  });

  it('should clear energy_parent_id when set to null', async () => {
    const parentSelector = 'test-device-feature-2';
    const childSelector = 'test-device-feature';

    const parent = await db.DeviceFeature.findOne({ where: { selector: parentSelector } });
    const child = await db.DeviceFeature.findOne({ where: { selector: childSelector } });

    // First set a parent
    await db.DeviceFeature.update({ energy_parent_id: parent.id }, { where: { id: child.id } });
    let check = await db.DeviceFeature.findOne({ where: { id: child.id } });
    expect(check.energy_parent_id).to.equal(parent.id);

    // Now clear it
    const updated = await device.updateFeature(childSelector, { energy_parent_id: null });
    expect(updated.energy_parent_id).to.equal(null);
    check = await db.DeviceFeature.findOne({ where: { id: child.id } });
    expect(check.energy_parent_id).to.equal(null);
  });

  it('should throw NotFoundError when selector does not exist', async () => {
    const promise = device.updateFeature('unknown-selector', {});
    await assert.isRejected(promise, 'DeviceFeature not found');
  });
});
