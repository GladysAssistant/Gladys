const sinon = require('sinon');
const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');
const { CONFIGURATION, DEFAULT } = require('../../../../../services/zwave-js-ui/lib/constants');

const { fake } = sinon;

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';

describe('zwaveJSUIManager commands', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      variable: {
        getValue: fake.resolves(true),
        setValue: fake.resolves(true),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, null, ZWAVEJSUI_SERVICE_ID);
  });

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.mqttExist = false;
    zwaveJSUIManager.mqttRunning = false;
    zwaveJSUIManager.mqttConnected = false;
    zwaveJSUIManager.zwaveJSUIExist = false;
    zwaveJSUIManager.zwaveJSUIRunning = false;
    zwaveJSUIManager.zwaveJSUIConnected = false;
    zwaveJSUIManager.scanInProgress = false;
    zwaveJSUIManager.usbConfigured = false;
  });

  it('should updateConfiguration', () => {
    const configuration = {
      externalZwaveJSUI: false,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      mqttTopicPrefix: 'mqttTopicPrefix',
      mqttTopicWithLocation: true,
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.DRIVER_PATH, 'driverPath', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(
      CONFIGURATION.ZWAVEJSUI_MQTT_URL,
      DEFAULT.ZWAVEJSUI_MQTT_URL_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );

    setValueStub.calledOnceWith(
      CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME,
      DEFAULT.ZWAVEJSUI_MQTT_USERNAME_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, 'mqttPassword', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_UNAUTHENTICATED, 's2UnauthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_AUTHENTICATED, 's2AuthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_ACCESS_CONTROL, 's2AccessControlKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S0_LEGACY, 's0LegacyKey', ZWAVEJSUI_SERVICE_ID);
  });

  it('should updateConfiguration external', () => {
    const configuration = {
      externalZwaveJSUI: true,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      mqttTopicPrefix: 'mqttTopicPrefix',
      mqttTopicWithLocation: true,
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_URL, 'mqttUrl', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, 'mqttUsername', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, 'mqttPassword', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX, 'mqttTopicPrefix', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION, '1', ZWAVEJSUI_SERVICE_ID);
  });

  it('should updateConfiguration external - reset', () => {
    const configuration = {
      externalZwaveJSUI: true,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: '',
      mqttPassword: '',
      mqttTopicPrefix: 'mqttTopicPrefix',
      mqttTopicWithLocation: true,
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    const destroyStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.destroy = destroyStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_URL, 'mqttUrl', ZWAVEJSUI_SERVICE_ID);

    destroyStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, ZWAVEJSUI_SERVICE_ID);

    destroyStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX, 'mqttTopicPrefix', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION, '1', ZWAVEJSUI_SERVICE_ID);
  });
});
