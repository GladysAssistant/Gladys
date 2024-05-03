const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { fake, assert } = sinon;

const portfinderMock = {
  getPortPromise: fake.resolves(12000),
};
const configureContainer = proxyquire('../../../../services/zigbee2mqtt/lib/configureContainer', {
  portfinder: portfinderMock,
});
const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './configureContainer': configureContainer,
});
const { DEFAULT } = require('../../../../services/zigbee2mqtt/lib/constants');
const { ADAPTERS_BY_CONFIG_KEY, CONFIG_KEYS } = require('../../../../services/zigbee2mqtt/adapters');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const configBasePath = path.join(__dirname, 'config');
const basePathOnContainer = path.join(configBasePath, 'container');
const configFilePath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);

const defaultConfigFilePath = path.join(configBasePath, 'z2m_default_config.yaml');
const mqttConfigFilePath = path.join(configBasePath, 'z2m_mqtt_config.yaml');
const mqttOtherConfigFilePath = path.join(configBasePath, 'z2m_mqtt-other_config.yaml');
const deconzConfigFilePath = path.join(configBasePath, 'z2m_adapter-deconz_config.yaml');
const ezspConfigFilePath = path.join(configBasePath, 'z2m_adapter-ezsp_config.yaml');
const portConfigFilePath = path.join(configBasePath, 'z2m_port_config.yaml');

describe('zigbee2mqtt configureContainer', () => {
  // PREPARE
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);

    fs.mkdirSync(path.dirname(configFilePath), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(basePathOnContainer, { force: true, recursive: true });
    sinon.reset();
  });

  it('it should write default file, overriding TCP port', async () => {
    // PREPARE
    const config = {};
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    // Check that file has been created with defaults
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
    assert.calledOnce(portfinderMock.getPortPromise);
  });

  it('it should force override to random TCP port', async () => {
    // PREPARE
    const config = {
      z2mTcpPort: null,
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
    assert.calledOnce(portfinderMock.getPortPromise);
  });

  it('it should force override to custom TCP port', async () => {
    // PREPARE
    const config = {
      z2mTcpPort: 9999,
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(portConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
    assert.notCalled(portfinderMock.getPortPromise);
  });

  it('it should only add mqtt credentials', async () => {
    // PREPARE
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(mqttConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should override mqtt credentials', async () => {
    // PREPARE
    fs.copyFileSync(mqttConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'other-mqtt-username',
      mqttPassword: 'other-mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(mqttOtherConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should keep mqtt credentials', async () => {
    // PREPARE
    fs.copyFileSync(mqttConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(mqttConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(false);
  });

  it('it should only add serial adapter', async () => {
    // PREPARE
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EZSP][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(ezspConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should remove serial adapter (adapter is not set)', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {};
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should remove serial adapter (adapter is expliclty none)', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.NONE][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should keep serial adapter', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EZSP][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(ezspConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(false);
  });

  it('it should override serial adapter', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.DECONZ][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(deconzConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });

  it('it should remove serial adapter (unknown adapter)', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = { z2mDongleName: 'this-is-not-a-real-adapter' };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.be.eq(true);
  });
});
