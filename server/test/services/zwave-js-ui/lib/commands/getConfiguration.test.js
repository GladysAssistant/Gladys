const sinon = require('sinon');

const { assert } = sinon;
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const gladys = {
  variable: {},
};

describe('zwave-js-ui getConfiguration', () => {
  // PREPARE
  const zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('it should getConfiguration not external', async () => {
    // PREPARE
    const getValueStub = sinon.stub();
    getValueStub
      .onCall(0)
      .returns('0')
      .onCall(1)
      .returns('mqttUrl')
      .onCall(2)
      .returns('mqttUsername')
      .onCall(3)
      .returns('mqttPassword')
      .onCall(4)
      .returns('mqttTopicPrefix')
      .onCall(5)
      .returns('mqttTopicWithLocation')
      .onCall(6)
      .returns('driverPath')
      .onCall(7)
      .returns('s2UnauthenticatedKey')
      .onCall(8)
      .returns('s2AuthenticatedKey')
      .onCall(9)
      .returns('s2AccessControlKey')
      .onCall(10)
      .returns('s0LegacyKey');
    zwaveJSUIManager.gladys.variable.getValue = getValueStub;
    // EXECUTE
    const configuration = await zwaveJSUIManager.getConfiguration();
    // ASSERT
    assert.match(configuration, {
      externalZwaveJSUI: false,
      driverPath: 'driverPath',
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    });
  });

  it('it should getConfiguration external', async () => {
    // PREPARE
    const getValueStub = sinon.stub();
    getValueStub
      .onCall(0)
      .returns('1')
      .onCall(1)
      .returns('mqttUrl')
      .onCall(2)
      .returns('mqttUsername')
      .onCall(3)
      .returns('mqttPassword')
      .onCall(4)
      .returns('mqttTopicPrefix')
      .onCall(5)
      .returns('mqttTopicWithLocation')
      .onCall(6)
      .returns('driverPath')
      .onCall(7)
      .returns('s2UnauthenticatedKey')
      .onCall(8)
      .returns('s2AuthenticatedKey')
      .onCall(9)
      .returns('s2AuthenticatedKey')
      .onCall(10)
      .returns('s2AuthenticatedKey');
    zwaveJSUIManager.gladys.variable.getValue = getValueStub;
    // EXECUTE
    const configuration = await zwaveJSUIManager.getConfiguration();
    // ASSERT
    assert.match(configuration, {
      externalZwaveJSUI: true,
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
    });
  });
});
