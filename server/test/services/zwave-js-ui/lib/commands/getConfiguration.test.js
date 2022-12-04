const sinon = require('sinon');
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');

const { assert } = sinon;

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const gladys = {};

describe('zwave-js-ui installMqttContainer', () => {
  // PREPARE
  const zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('it should getConfiguration not ready', async () => {
    // PREPARE
    zwaveJSUIManager.externalZwaveJSUI = false;
    zwaveJSUIManager.mqttUrl = 'mqttUrl';
    zwaveJSUIManager.mqttUsername = 'mqttUsername';
    zwaveJSUIManager.mqttPassword = 'mqttPassword';
    zwaveJSUIManager.driverPath = 'driverPath';
    zwaveJSUIManager.s2UnauthenticatedKey = 's2UnauthenticatedKey';
    zwaveJSUIManager.s2AuthenticatedKey = 's2AuthenticatedKey';
    zwaveJSUIManager.s2AccessControlKey = 's2AccessControlKey';
    zwaveJSUIManager.s0LegacyKey = 's0LegacyKey';
    // EXECUTE
    const configuration = await zwaveJSUIManager.getConfiguration();
    // ASSERT
    assert.match(configuration, {
      externalZwaveJSUI: false,
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      driverPath: 'driverPath',
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    });
  });

  it('it should getConfiguration ready', async () => {
    // PREPARE
    zwaveJSUIManager.controller = {
      ready: true,
    };
    zwaveJSUIManager.externalZwaveJSUI = false;
    zwaveJSUIManager.mqttUrl = 'mqttUrl';
    zwaveJSUIManager.mqttUsername = 'mqttUsername';
    zwaveJSUIManager.mqttPassword = 'mqttPassword';
    zwaveJSUIManager.driverPath = 'driverPath';
    zwaveJSUIManager.s2UnauthenticatedKey = 's2UnauthenticatedKey';
    zwaveJSUIManager.s2AuthenticatedKey = 's2AuthenticatedKey';
    zwaveJSUIManager.s2AccessControlKey = 's2AccessControlKey';
    zwaveJSUIManager.s0LegacyKey = 's0LegacyKey';
    // EXECUTE
    const configuration = await zwaveJSUIManager.getConfiguration();
    // ASSERT
    assert.match(configuration, {
      externalZwaveJSUI: false,
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      driverPath: 'driverPath',
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    });
  });
});
