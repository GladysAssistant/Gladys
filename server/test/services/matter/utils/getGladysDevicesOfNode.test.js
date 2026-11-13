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
    const devices = {
      'matter:1234:1': { name: 'Plug', selector: 'plug', external_id: 'matter:1234:1', features: [] },
      'matter:1234:1:2': { name: 'Plug 2', selector: 'plug-2', external_id: 'matter:1234:1:2', features: [] },
      'matter:12345:1': { name: 'Other node', selector: 'other-node', external_id: 'matter:12345:1' },
      'zigbee2mqtt:1234': { name: 'Zigbee', selector: 'zigbee', external_id: 'zigbee2mqtt:1234' },
    };
    const stateManager = {
      getAllKeys: fake.returns([...Object.keys(devices), 'matter:1234:3']),
      // a key whose device was removed in the meantime
      get: (entity, externalId) => (devices[externalId] === undefined ? null : devices[externalId]),
    };
    expect(getGladysDevicesOfNode(stateManager, 1234n)).to.deep.equal([
      { name: 'Plug', selector: 'plug' },
      { name: 'Plug 2', selector: 'plug-2' },
    ]);
    assert.calledOnceWithExactly(stateManager.getAllKeys, 'deviceByExternalId');
  });
});
