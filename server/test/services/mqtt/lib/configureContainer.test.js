const sinon = require('sinon');
const os = require('os');
const { constants } = require('fs');
const proxiquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const gladys = {};
const mqttClient = {};
const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.configureContainer', () => {
  const fsMock = {};
  const configureContainer = proxiquire('../../../../services/mqtt/lib/configureContainer', {
    'fs/promises': fsMock,
  });
  const MqttHandler = proxiquire('../../../../services/mqtt/lib', {
    './configureContainer': configureContainer,
  });

  beforeEach(() => {
    fsMock.mkdir = fake.resolves(true);
    fsMock.access = fake.resolves(true);
    fsMock.readFile = fake.resolves('read');
    fsMock.appendFile = fake.resolves(true);
    fsMock.writeFile = fake.resolves('write');
    fsMock.open = fake.resolves({ close: () => {} });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not write configuration', async () => {
    fsMock.readFile = fake.resolves(`1st line${os.EOL}listener 1883`);

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer();

    assert.calledOnceWithExactly(fsMock.mkdir, '/var/lib/gladysassistant/mosquitto', { recursive: true });
    assert.calledOnceWithExactly(
      fsMock.access,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      // eslint-disable-next-line no-bitwise
      constants.R_OK | constants.W_OK,
    );
    assert.calledOnceWithExactly(fsMock.readFile, '/var/lib/gladysassistant/mosquitto/mosquitto.conf');
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
    assert.notCalled(fsMock.appendFile);
    assert.notCalled(fsMock.writeFile);
  });

  it('should write default port', async () => {
    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer();

    assert.calledOnceWithExactly(fsMock.mkdir, '/var/lib/gladysassistant/mosquitto', { recursive: true });
    assert.calledOnceWithExactly(
      fsMock.access,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      // eslint-disable-next-line no-bitwise
      constants.R_OK | constants.W_OK,
    );
    assert.calledOnceWithExactly(fsMock.readFile, '/var/lib/gladysassistant/mosquitto/mosquitto.conf');
    assert.calledOnceWithExactly(
      fsMock.appendFile,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      `${os.EOL}listener 1883`,
    );
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
    assert.notCalled(fsMock.writeFile);
  });

  it('should create default configuration file', async () => {
    fsMock.access = fake.rejects();

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer();

    assert.calledOnceWithExactly(fsMock.mkdir, '/var/lib/gladysassistant/mosquitto', { recursive: true });
    assert.calledOnceWithExactly(
      fsMock.access,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      // eslint-disable-next-line no-bitwise
      constants.R_OK | constants.W_OK,
    );
    assert.notCalled(fsMock.readFile);
    assert.notCalled(fsMock.appendFile);
    assert.calledOnceWithExactly(
      fsMock.writeFile,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      `allow_anonymous false${os.EOL}connection_messages false${os.EOL}password_file /mosquitto/config/mosquitto.passwd${os.EOL}listener 1883`,
    );
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
  });
});
