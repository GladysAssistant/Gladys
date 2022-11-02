const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const fs = require('fs');
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
});
