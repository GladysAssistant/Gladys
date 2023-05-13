const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const { DEFAULT } = require('../../../../services/zigbee2mqtt/lib/constants');
const { ADAPTERS_BY_CONFIG_KEY, CONFIG_KEYS } = require('../../../../services/zigbee2mqtt/adapters');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const basePathOnContainer = path.join(__dirname, 'container');

const expectedDefaultContent = `\
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://localhost:1884
serial:
  port: /dev/ttyACM0
frontend:
  port: 8080
map_options:
  graphviz:
    colors:
      fill:
        enddevice: "#fff8ce"
        coordinator: "#e04e5d"
        router: "#4ea3e0"
      font:
        coordinator: "#ffffff"
        router: "#ffffff"
        enddevice: "#000000"
      line:
        active: "#009900"
        inactive: "#994444"
`;

const expectedMqttContent = `\
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://localhost:1884
  user: mqtt-username
  password: mqtt-password
serial:
  port: /dev/ttyACM0
frontend:
  port: 8080
map_options:
  graphviz:
    colors:
      fill:
        enddevice: "#fff8ce"
        coordinator: "#e04e5d"
        router: "#4ea3e0"
      font:
        coordinator: "#ffffff"
        router: "#ffffff"
        enddevice: "#000000"
      line:
        active: "#009900"
        inactive: "#994444"
`;

const expectedOtherMqttContent = `\
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://localhost:1884
  user: other-mqtt-username
  password: other-mqtt-password
serial:
  port: /dev/ttyACM0
frontend:
  port: 8080
map_options:
  graphviz:
    colors:
      fill:
        enddevice: "#fff8ce"
        coordinator: "#e04e5d"
        router: "#4ea3e0"
      font:
        coordinator: "#ffffff"
        router: "#ffffff"
        enddevice: "#000000"
      line:
        active: "#009900"
        inactive: "#994444"
`;

const expectedEZSPContent = `\
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://localhost:1884
serial:
  port: /dev/ttyACM0
  adapter: ezsp
frontend:
  port: 8080
map_options:
  graphviz:
    colors:
      fill:
        enddevice: "#fff8ce"
        coordinator: "#e04e5d"
        router: "#4ea3e0"
      font:
        coordinator: "#ffffff"
        router: "#ffffff"
        enddevice: "#000000"
      line:
        active: "#009900"
        inactive: "#994444"
`;

const expectedDeconzContent = `\
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://localhost:1884
serial:
  port: /dev/ttyACM0
  adapter: deconz
frontend:
  port: 8080
map_options:
  graphviz:
    colors:
      fill:
        enddevice: "#fff8ce"
        coordinator: "#e04e5d"
        router: "#4ea3e0"
      font:
        coordinator: "#ffffff"
        router: "#ffffff"
        enddevice: "#000000"
      line:
        active: "#009900"
        inactive: "#994444"
`;

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
  });

  afterEach(() => {
    fs.rmSync(basePathOnContainer, { force: true, recursive: true });
  });

  it('it should write default file', async () => {
    // PREPARE
    const config = {
      key: 'value',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    // Check that file has been created with defaults
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedDefaultContent);
  });

  it('it should not override existong configuration file', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    const customConfigContent = 'content: custom';
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), customConfigContent);
    const config = {
      key: 'value',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(customConfigContent);
  });

  it('it should only add mqtt credentials', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedDefaultContent);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedMqttContent);
  });

  it('it should override mqtt credentials', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedDefaultContent);
    const config = {
      mqttUsername: 'other-mqtt-username',
      mqttPassword: 'other-mqtt-password',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedOtherMqttContent);
  });

  it('it should keep mqtt credentials', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedMqttContent);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedMqttContent);
  });

  it('it should only add serial adapter', async () => {
    // PREPARE
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EZSP][0],
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedEZSPContent);
  });

  it('it should remove serial adapter (adapter is not set)', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedEZSPContent);
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedDefaultContent);
  });

  it('it should remove serial adapter (adapter is expliclty none)', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedEZSPContent);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.NONE][0],
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedDefaultContent);
  });

  it('it should keep serial adapter', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedEZSPContent);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EZSP][0],
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedEZSPContent);
  });

  it('it should override serial adapter', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedEZSPContent);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.DECONZ][0],
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedDeconzContent);
  });

  it('it should remove serial adapter (unknown adapter)', async () => {
    // PREPARE
    // Create directory
    const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
    fs.mkdirSync(path.dirname(configFilepath), { recursive: true });
    // Create custom config file
    fs.writeFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), expectedEZSPContent);
    const config = { z2mDongleName: 'this-is-not-a-real-adapter' };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const content = fs.readFileSync(path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH), 'utf8');
    expect(content.toString()).to.equal(expectedDefaultContent);
  });
});
