const sinon = require('sinon').createSandbox();
const os = require('os');
const path = require('path');
const realFs = require('fs/promises');
const { constants } = require('fs');
const { expect } = require('chai');
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
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'a');
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
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'a');
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
    assert.calledOnceWithExactly(fsMock.open, '/var/lib/gladysassistant/mosquitto/mosquitto.passwd', 'a');
  });
});

describe('mqttHandler.configureContainer on a real file system', () => {
  const MOSQUITTO_DIRECTORY = '/var/lib/gladysassistant/mosquitto';
  let tmpDirectory;

  // Every fs call targets the broker directory: redirect it to a temporary one
  const redirectedFs = Object.fromEntries(
    ['mkdir', 'access', 'readFile', 'appendFile', 'writeFile', 'open'].map((name) => [
      name,
      (filePath, ...args) => realFs[name](filePath.replace(MOSQUITTO_DIRECTORY, tmpDirectory), ...args),
    ]),
  );
  const { configureContainer } = proxiquire('../../../../services/mqtt/lib/configureContainer', {
    'fs/promises': redirectedFs,
  });

  beforeEach(async () => {
    tmpDirectory = await realFs.mkdtemp(path.join(os.tmpdir(), 'gladys-mosquitto-'));
  });

  afterEach(async () => {
    await realFs.rm(tmpDirectory, { recursive: true, force: true });
  });

  it('should keep the users of an existing password file', async () => {
    // State left by a previous install: the broker reinstall on a mosquitto upgrade must not wipe it
    const passwordFileContent = `gladys:$7$101$c2FsdA==$aGFzaA==${os.EOL}device:$7$101$c2FsdA==$aGFzaA==${os.EOL}`;
    await realFs.writeFile(
      path.join(tmpDirectory, 'mosquitto.conf'),
      `allow_anonymous false${os.EOL}password_file /mosquitto/config/mosquitto.passwd${os.EOL}listener 1883`,
    );
    await realFs.writeFile(path.join(tmpDirectory, 'mosquitto.passwd'), passwordFileContent);

    await configureContainer();

    const passwordFile = await realFs.readFile(path.join(tmpDirectory, 'mosquitto.passwd'), 'utf8');
    expect(passwordFile).to.equal(passwordFileContent);
  });

  it('should create an empty password file when missing', async () => {
    await configureContainer();

    const passwordFile = await realFs.readFile(path.join(tmpDirectory, 'mosquitto.passwd'), 'utf8');
    expect(passwordFile).to.equal('');
    const configFile = await realFs.readFile(path.join(tmpDirectory, 'mosquitto.conf'), 'utf8');
    expect(configFile).to.include('allow_anonymous false');
  });
});
