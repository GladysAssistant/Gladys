const { expect } = require('chai');
const sinon = require('sinon');
const os = require('os');
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
    assert.calledOnceWithExactly(fsMock.readFile, '/var/lib/gladysassistant/mosquitto/mosquitto.conf');
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
    assert.notCalled(fsMock.appendFile);
    assert.notCalled(fsMock.writeFile);
  });

  it('should append the listener line when the config has none', async () => {
    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer();

    assert.calledOnceWithExactly(fsMock.mkdir, '/var/lib/gladysassistant/mosquitto', { recursive: true });
    assert.calledOnceWithExactly(fsMock.readFile, '/var/lib/gladysassistant/mosquitto/mosquitto.conf');
    assert.calledOnceWithExactly(
      fsMock.writeFile,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      `read${os.EOL}listener 1883`,
    );
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
    assert.notCalled(fsMock.appendFile);
  });

  it('should replace the listener line when the resolved port differs', async () => {
    fsMock.readFile = fake.resolves(`allow_anonymous false${os.EOL}listener 1883`);

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer(1885);

    assert.calledOnceWithExactly(
      fsMock.writeFile,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      `allow_anonymous false${os.EOL}listener 1885`,
    );
    assert.notCalled(fsMock.appendFile);
  });

  it('should not rewrite the config when the listener already matches the resolved port', async () => {
    fsMock.readFile = fake.resolves(`allow_anonymous false${os.EOL}listener 1885`);

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer(1885);

    assert.notCalled(fsMock.writeFile);
    assert.notCalled(fsMock.appendFile);
  });

  it('should create default configuration file when none exists (ENOENT)', async () => {
    const notFound = new Error('no such file');
    notFound.code = 'ENOENT';
    fsMock.readFile = fake.rejects(notFound);

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    await mqttHandler.configureContainer();

    assert.calledOnceWithExactly(fsMock.mkdir, '/var/lib/gladysassistant/mosquitto', { recursive: true });
    assert.calledOnceWithExactly(fsMock.readFile, '/var/lib/gladysassistant/mosquitto/mosquitto.conf');
    assert.notCalled(fsMock.appendFile);
    assert.calledOnceWithExactly(
      fsMock.writeFile,
      '/var/lib/gladysassistant/mosquitto/mosquitto.conf',
      `allow_anonymous false${os.EOL}connection_messages false${os.EOL}password_file /mosquitto/config/mosquitto.passwd${os.EOL}listener 1883`,
    );
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'w');
  });

  it('should not overwrite the configuration when reading it fails with a non-ENOENT error', async () => {
    const ioError = new Error('I/O error');
    ioError.code = 'EIO';
    fsMock.readFile = fake.rejects(ioError);

    const mqttHandler = new MqttHandler(gladys, mqttClient, serviceId);
    let thrown;
    try {
      await mqttHandler.configureContainer();
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.equal(ioError);
    assert.notCalled(fsMock.writeFile);
    assert.notCalled(fsMock.appendFile);
  });
});
