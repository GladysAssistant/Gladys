const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const {
  getNodeExternalIdPrefix,
  getGladysDevicesOfNode,
} = require('../../../../services/matter/utils/getGladysDevicesOfNode');

describe('Matter.getGladysDevicesOfNode', () => {
  it('should build the external_id prefix of a node', () => {
    expect(getNodeExternalIdPrefix(1234n)).to.equal('matter:1234:');
    expect(getNodeExternalIdPrefix('1234')).to.equal('matter:1234:');
  });
  it('should list the Gladys devices of the node only', () => {
    const devicesById = {
      'id-1': { name: 'Plug', selector: 'plug', external_id: 'matter:1234:1', features: [] },
      'id-2': { name: 'Plug 2', selector: 'plug-2', external_id: 'matter:1234:1:2', features: [] },
      'id-3': { name: 'Other node', selector: 'other-node', external_id: 'matter:12345:1' },
      'id-4': { name: 'Zigbee', selector: 'zigbee', external_id: 'zigbee2mqtt:1234' },
      // taken over by a re-paired node: a stale deviceByExternalId key still lists it under 1234
      'id-5': { name: 'Replaced', selector: 'replaced', external_id: 'matter:9999:1' },
    };
    const stateManager = {
      getAllKeys: fake.returns([...Object.keys(devicesById), 'id-6']),
      // a key whose device was removed in the meantime
      get: (entity, id) => (devicesById[id] === undefined ? null : devicesById[id]),
    };
    expect(getGladysDevicesOfNode(stateManager, 1234n)).to.deep.equal([
      { name: 'Plug', selector: 'plug' },
      { name: 'Plug 2', selector: 'plug-2' },
    ]);
    assert.calledOnceWithExactly(stateManager.getAllKeys, 'deviceById');
  });
});
