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

  it('should return null when deviceFeature is null', () => {
    const result = energySensorManager.getRootElectricMeterDevice(null);
    expect(result).to.equal(null);
  });

  it('should return null when deviceFeature is undefined', () => {
    const result = energySensorManager.getRootElectricMeterDevice(undefined);
    expect(result).to.equal(null);
  });

  it('should detect and handle circular reference (self-referencing)', () => {
    const selfReferencingFeature = {
      id: 'circular-0001-0001-0001-000000000001',
      name: 'Self Referencing Meter',
      energy_parent_id: 'circular-0001-0001-0001-000000000001',
    };

    // Set up state manager with self-referencing feature
    stateManager.setState('deviceFeatureById', 'circular-0001-0001-0001-000000000001', selfReferencingFeature);

    const result = energySensorManager.getRootElectricMeterDevice(selfReferencingFeature);

    // Should return null due to circular reference
    expect(result).to.equal(null);
  });

  it('should detect and handle circular reference (two features referencing each other)', () => {
    const featureA = {
      id: 'circular-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Feature A',
      energy_parent_id: 'circular-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    };

    const featureB = {
      id: 'circular-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Feature B',
      energy_parent_id: 'circular-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    };

    // Set up state manager with circular references
    stateManager.setState('deviceFeatureById', 'circular-aaaa-aaaa-aaaa-aaaaaaaaaaaa', featureA);
    stateManager.setState('deviceFeatureById', 'circular-bbbb-bbbb-bbbb-bbbbbbbbbbbb', featureB);

    const result = energySensorManager.getRootElectricMeterDevice(featureA);

    // Should return null due to circular reference
    expect(result).to.equal(null);
  });

  it('should detect and handle circular reference in longer chain', () => {
    // Setup: A -> B -> C -> A (circular)
    const featureA = {
      id: 'chain-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Feature A',
      energy_parent_id: 'chain-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    };

    const featureB = {
      id: 'chain-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Feature B',
      energy_parent_id: 'chain-cccc-cccc-cccc-cccccccccccc',
    };

    const featureC = {
      id: 'chain-cccc-cccc-cccc-cccccccccccc',
      name: 'Feature C',
      energy_parent_id: 'chain-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    };

    // Set up state manager
    stateManager.setState('deviceFeatureById', 'chain-aaaa-aaaa-aaaa-aaaaaaaaaaaa', featureA);
    stateManager.setState('deviceFeatureById', 'chain-bbbb-bbbb-bbbb-bbbbbbbbbbbb', featureB);
    stateManager.setState('deviceFeatureById', 'chain-cccc-cccc-cccc-cccccccccccc', featureC);

    const result = energySensorManager.getRootElectricMeterDevice(featureA);

    // Should return null due to circular reference
    expect(result).to.equal(null);
  });

  it('should return null when intermediate parent does not exist in state manager', () => {
    // Setup: root <- missing_parent <- child
    const rootFeature = {
      id: 'root-1111-1111-1111-111111111111',
      name: 'Root Meter',
      energy_parent_id: null,
    };

    const childFeature = {
      id: 'child-3333-3333-3333-333333333333',
      name: 'Child Meter',
      energy_parent_id: 'missing-2222-2222-2222-222222222222',
    };

    // Only set up root, not the intermediate parent
    stateManager.setState('deviceFeatureById', 'root-1111-1111-1111-111111111111', rootFeature);

    const result = energySensorManager.getRootElectricMeterDevice(childFeature);

    // Should return null because intermediate parent is missing
    expect(result).to.equal(null);
  });

  it('should return null when parent in chain does not exist', () => {
    // Setup: root <- parent <- child, but parent points to non-existent grandparent
    const parentFeature = {
      id: 'parent-2222-2222-2222-222222222222',
      name: 'Parent Meter',
      energy_parent_id: 'nonexistent-0000-0000-0000-000000000000',
    };

    const childFeature = {
      id: 'child-3333-3333-3333-333333333333',
      name: 'Child Meter',
      energy_parent_id: 'parent-2222-2222-2222-222222222222',
    };

    // Set up state manager with parent but not grandparent
    stateManager.setState('deviceFeatureById', 'parent-2222-2222-2222-222222222222', parentFeature);

    const result = energySensorManager.getRootElectricMeterDevice(childFeature);

    // Should return null because grandparent doesn't exist
    expect(result).to.equal(null);
  });

  it('should return null when hierarchy depth exceeds maximum limit', () => {
    // Create a chain of 102 features (exceeds MAX_HIERARCHY_DEPTH of 100)
    const features = [];
    for (let i = 0; i <= 101; i += 1) {
      const parentId = i === 0 ? null : `depth-test-${String(i - 1).padStart(4, '0')}-0000-0000-000000000000`;
      features.push({
        id: `depth-test-${String(i).padStart(4, '0')}-0000-0000-000000000000`,
        name: `Feature Level ${i}`,
        energy_parent_id: parentId,
      });
    }

    // Set up all features in state manager
    features.forEach((feature) => {
      stateManager.setState('deviceFeatureById', feature.id, feature);
    });

    // Start from the deepest feature (index 101)
    const deepestFeature = features[101];
    const result = energySensorManager.getRootElectricMeterDevice(deepestFeature);

    // Should return null because depth exceeds MAX_HIERARCHY_DEPTH (100)
    expect(result).to.equal(null);
  });
});
