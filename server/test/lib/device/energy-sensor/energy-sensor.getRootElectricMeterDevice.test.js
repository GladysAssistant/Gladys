const { expect } = require('chai');
const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const EnergySensorManager = require('../../../../lib/device/energy-sensor');

const event = new EventEmitter();

describe('Device.getRootElectricMeterDevice', () => {
  let energySensorManager;
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(event);
    energySensorManager = new EnergySensorManager(stateManager);
  });

  it('should return the device feature itself when it has no parent', () => {
    const deviceFeature = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Main Meter',
      energy_parent_id: null,
    };

    const result = energySensorManager.getRootElectricMeterDevice(deviceFeature);

    expect(result).to.deep.equal(deviceFeature);
  });

  it('should return the direct parent when parent has no parent', () => {
    const parentFeature = {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      name: 'Parent Meter',
      energy_parent_id: null,
    };

    const childFeature = {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      name: 'Child Meter',
      energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    };

    // Set up state manager with parent
    stateManager.setState('deviceFeatureById', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', parentFeature);

    const result = energySensorManager.getRootElectricMeterDevice(childFeature);

    expect(result).to.deep.equal(parentFeature);
  });

  it('should traverse multiple levels to find root parent', () => {
    // Setup: grandparent <- parent <- child
    const grandparentFeature = {
      id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
      name: 'Grandparent Meter',
      energy_parent_id: null,
    };

    const parentFeature = {
      id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
      name: 'Parent Meter',
      energy_parent_id: 'd4e5f6a7-b8c9-0123-def1-234567890123',
    };

    const childFeature = {
      id: 'f6a7b8c9-d0e1-2345-f123-456789012345',
      name: 'Child Meter',
      energy_parent_id: 'e5f6a7b8-c9d0-1234-ef12-345678901234',
    };

    // Set up state manager
    stateManager.setState('deviceFeatureById', 'd4e5f6a7-b8c9-0123-def1-234567890123', grandparentFeature);
    stateManager.setState('deviceFeatureById', 'e5f6a7b8-c9d0-1234-ef12-345678901234', parentFeature);

    const result = energySensorManager.getRootElectricMeterDevice(childFeature);

    // Should return the grandparent (root)
    expect(result).to.deep.equal(grandparentFeature);
  });

  it('should handle deep hierarchy with multiple levels', () => {
    // Setup: root <- level1 <- level2 <- level3
    const rootFeature = {
      id: 'a7b8c9d0-e1f2-3456-1234-567890123456',
      name: 'Root Meter',
      energy_parent_id: null,
    };

    const level1Feature = {
      id: 'b8c9d0e1-f2a3-4567-2345-678901234567',
      name: 'Level 1 Meter',
      energy_parent_id: 'a7b8c9d0-e1f2-3456-1234-567890123456',
    };

    const level2Feature = {
      id: 'c9d0e1f2-a3b4-5678-3456-789012345678',
      name: 'Level 2 Meter',
      energy_parent_id: 'b8c9d0e1-f2a3-4567-2345-678901234567',
    };

    const level3Feature = {
      id: 'd0e1f2a3-b4c5-6789-4567-890123456789',
      name: 'Level 3 Meter',
      energy_parent_id: 'c9d0e1f2-a3b4-5678-3456-789012345678',
    };

    // Set up state manager
    stateManager.setState('deviceFeatureById', 'a7b8c9d0-e1f2-3456-1234-567890123456', rootFeature);
    stateManager.setState('deviceFeatureById', 'b8c9d0e1-f2a3-4567-2345-678901234567', level1Feature);
    stateManager.setState('deviceFeatureById', 'c9d0e1f2-a3b4-5678-3456-789012345678', level2Feature);

    const result = energySensorManager.getRootElectricMeterDevice(level3Feature);

    // Should return the root
    expect(result).to.deep.equal(rootFeature);
  });

  it('should handle case where parent does not exist in state manager', () => {
    const childFeature = {
      id: 'e1f2a3b4-c5d6-7890-5678-901234567890',
      name: 'Child Meter',
      energy_parent_id: 'f2a3b4c5-d6e7-8901-6789-012345678901',
    };

    // Parent is not in state manager, so stateManager.get returns null
    const result = energySensorManager.getRootElectricMeterDevice(childFeature);

    // Should return null when parent doesn't exist
    expect(result).to.equal(null);
  });
});
