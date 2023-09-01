const { expect } = require('chai');
const {
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureExternalId,
  getNodeInfoByExternalId,
  getNodeStateInfoByExternalId,
} = require('../../../../../services/overkiz/lib/utils/overkiz.externalId');

describe('Overkiz externalId', () => {
  it('should getDeviceName', () => {
    const node = {
      label: '_label',
      place: '_place',
    };
    const deviceName = getDeviceName(node);
    expect(deviceName).to.equals('_label (_place)');
  });

  it('should getDeviceExternalId', () => {
    const node = {
      deviceURL: '_deviceURL',
    };
    const deviceExternalId = getDeviceExternalId(node);
    expect(deviceExternalId).to.equals('overkiz:deviceURL:_deviceURL');
  });

  it('should getDeviceFeatureExternalId', () => {
    const node = {
      deviceURL: '_deviceURL',
    };
    const state = '_state';
    const deviceFeatureExternalId = getDeviceFeatureExternalId(node, state);
    expect(deviceFeatureExternalId).to.equals('overkiz:deviceURL:_deviceURL:state:_state');
  });

  it('should getNodeInfoByExternalId', () => {
    const device = {
      external_id: '0:1:deviceURL:_deviceURL:4:5:6',
    };
    const nodeInfoByExternalId = getNodeInfoByExternalId(device);
    expect(nodeInfoByExternalId).to.deep.equals({
      deviceURL: '_deviceURL',
    });
  });

  it('should getNodeStateInfoByExternalId', () => {
    const deviceFeature = {
      external_id: '0:1:deviceURL:_deviceURL:4:state:_state',
    };
    const nodeStateInfoByExternalId = getNodeStateInfoByExternalId(deviceFeature);
    expect(nodeStateInfoByExternalId).to.deep.equals({
      deviceURL: '_deviceURL',
      state: '_state',
    });
  });
});
