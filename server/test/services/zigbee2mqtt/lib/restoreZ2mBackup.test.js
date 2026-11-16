const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { assert } = sinon;
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

const { fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
  variable: {
    getValue: fake.resolves(null),
  },
};

const mqttLibrary = {};
const serviceId = '625a8a9a-aa9d-474f-8cec-0718dd4ade04';
const backupPath = path.join(__dirname, 'backup');
const outputPath = path.join(backupPath, 'extract');

describe('zigbee2mqtt restoreZ2mBackup', () => {
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    fs.rmSync(outputPath, { force: true, recursive: true });
    sinon.reset();
  });

  it('should not restore missing backup', async () => {
    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    assert.calledOnceWithExactly(gladys.variable.getValue, 'Z2M_BACKUP', serviceId);

    expect(fs.readdirSync(path.join(outputPath))).deep.equals([]);
  });

  it('should not restore backup, config already there', async () => {
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, 'configuration.yaml'), 'empty');
    await zigbee2MqttService.restoreZ2mBackup(outputPath);
    assert.notCalled(gladys.variable.getValue);
  });

  it('should unzip backup', async () => {
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());

    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    assert.calledOnceWithExactly(gladys.variable.getValue, 'Z2M_BACKUP', serviceId);

    expect(fs.existsSync(path.join(outputPath, 'configuration.yaml'))).equals(true);
    expect(fs.existsSync(path.join(outputPath, 'coordinator_backup.json'))).equals(true);
    expect(fs.existsSync(path.join(outputPath, 'database.db'))).equals(true);
    expect(fs.existsSync(path.join(outputPath, 'state.json'))).equals(true);
  });

  it('should keep the files already in the folder', async () => {
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());
    // Written since the backup
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, 'database.db'), 'newer database');

    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    expect(fs.readFileSync(path.join(outputPath, 'database.db'), 'utf8')).equals('newer database');
    expect(fs.existsSync(path.join(outputPath, 'configuration.yaml'))).equals(true);
    expect(fs.existsSync(path.join(outputPath, 'coordinator_backup.json'))).equals(true);
  });

  it('should restore the folders of the backup', async () => {
    // Holds external_converters/my-device.js
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-subfolder.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());

    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    expect(fs.existsSync(path.join(outputPath, 'configuration.yaml'))).equals(true);
    expect(fs.readFileSync(path.join(outputPath, 'external_converters', 'my-device.js'), 'utf8')).equals(
      'module.exports = [];\n',
    );
  });

  it('should keep the entries of the backup in its folder', async () => {
    // Holds an entry named ../escaped.txt
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-parent-path.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());

    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    expect(fs.existsSync(path.join(outputPath, 'escaped.txt'))).equals(true);
    expect(fs.existsSync(path.join(backupPath, 'escaped.txt'))).equals(false);
  });

  it('should fail, without the files cut short, when the files of the backup cannot be written', async () => {
    const writeError = new Error('ENOSPC: no space left on device');
    writeError.code = 'ENOSPC';
    // The disk is full: each file is created, then cut short
    const writeFile = fake(async (filePath) => {
      await fsPromises.writeFile(filePath, 'cut');
      throw writeError;
    });
    const { restoreZ2mBackup } = proxyquire('../../../../services/zigbee2mqtt/lib/restoreZ2mBackup', {
      'fs/promises': { ...fsPromises, writeFile },
    });
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64.backup'));
    const manager = { gladys: { variable: { getValue: fake.resolves(base64Zip.toString()) } }, serviceId };

    await expect(restoreZ2mBackup.call(manager, outputPath)).to.be.rejectedWith('ENOSPC');

    // Not kept by the next restore as newer than the backup
    expect(fs.readdirSync(outputPath)).deep.equals([]);
  });

  it('should not write the configuration file when another file of the backup cannot be written', async () => {
    // Holds configuration.yaml and external_converters/my-device.js
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-subfolder.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());
    // A file in place of the folder of the external converters: creating it fails at once
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, 'external_converters'), 'not a folder');

    await expect(zigbee2MqttService.restoreZ2mBackup(outputPath)).to.be.rejected;

    // Kept as is by the next start: the backup is restored again instead
    expect(fs.existsSync(path.join(outputPath, 'configuration.yaml'))).equals(false);
  });

  it('should restore a backup without configuration file', async () => {
    // Holds database.db only
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-without-configuration.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());

    await zigbee2MqttService.restoreZ2mBackup(outputPath);

    expect(fs.readdirSync(outputPath)).deep.equals(['database.db']);
  });

  it('should replace the files to replace, and set them aside', async () => {
    // Holds configuration.yaml, coordinator_backup.json and database.db
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-replace.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());
    // Cut short
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, 'configuration.yaml'), 'homeassistant: false\nmqtt: [');
    fs.writeFileSync(path.join(outputPath, 'coordinator_backup.json'), '');
    fs.writeFileSync(path.join(outputPath, 'database.db'), 'newer database');

    await zigbee2MqttService.restoreZ2mBackup(outputPath, ['configuration.yaml', 'coordinator_backup.json']);

    expect(fs.readFileSync(path.join(outputPath, 'configuration.yaml'), 'utf8')).equals('homeassistant: false\n');
    expect(fs.readFileSync(path.join(outputPath, 'coordinator_backup.json'), 'utf8')).equals('{"version":1}\n');
    expect(fs.readFileSync(path.join(outputPath, 'database.db'), 'utf8')).equals('newer database');
    const setAside = fs.readdirSync(outputPath).filter((file) => file.includes('.invalid-'));
    expect(setAside).to.have.lengthOf(2);
    const setAsideConfiguration = setAside.find((file) => file.startsWith('configuration.yaml.invalid-'));
    expect(fs.readFileSync(path.join(outputPath, setAsideConfiguration), 'utf8')).equals(
      'homeassistant: false\nmqtt: [',
    );
    const setAsideCoordinatorBackup = setAside.find((file) => file.startsWith('coordinator_backup.json.invalid-'));
    expect(fs.readFileSync(path.join(outputPath, setAsideCoordinatorBackup), 'utf8')).equals('');
  });

  it('should keep a file set aside before when it sets aside another one', async () => {
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-replace.backup'));
    gladys.variable.getValue = fake.resolves(base64Zip.toString());
    const earlierSetAside = 'configuration.yaml.invalid-2026-11-01T00-00-00.000Z';
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, earlierSetAside), 'earlier');
    fs.writeFileSync(path.join(outputPath, 'configuration.yaml'), 'mqtt: [');

    await zigbee2MqttService.restoreZ2mBackup(outputPath, ['configuration.yaml']);

    const setAside = fs.readdirSync(outputPath).filter((file) => file.startsWith('configuration.yaml.invalid-'));
    expect(setAside).to.have.lengthOf(2);
    expect(fs.readFileSync(path.join(outputPath, earlierSetAside), 'utf8')).equals('earlier');
  });

  it('should leave a file to replace whole when the one of the backup cannot be written', async () => {
    const writeError = new Error('ENOSPC: no space left on device');
    writeError.code = 'ENOSPC';
    // The disk is full once the other files are written: the file that replaces the configuration file is cut short
    const writeFile = fake(async (filePath, content, options) => {
      if (!filePath.endsWith('.tmp')) {
        await fsPromises.writeFile(filePath, content, options);
        return;
      }
      await fsPromises.writeFile(filePath, 'cut');
      throw writeError;
    });
    const { restoreZ2mBackup } = proxyquire('../../../../services/zigbee2mqtt/lib/restoreZ2mBackup', {
      'fs/promises': { ...fsPromises, writeFile },
    });
    const base64Zip = fs.readFileSync(path.join(backupPath, 'base64-replace.backup'));
    const manager = { gladys: { variable: { getValue: fake.resolves(base64Zip.toString()) } }, serviceId };
    fs.mkdirSync(outputPath);
    fs.writeFileSync(path.join(outputPath, 'configuration.yaml'), 'mqtt: [');

    await expect(restoreZ2mBackup.call(manager, outputPath, ['configuration.yaml'])).to.be.rejectedWith('ENOSPC');

    expect(fs.readFileSync(path.join(outputPath, 'configuration.yaml'), 'utf8')).equals('mqtt: [');
    // Nothing left behind
    expect(fs.readdirSync(outputPath).sort()).deep.equals([
      'configuration.yaml',
      'coordinator_backup.json',
      'database.db',
    ]);
  });
});
