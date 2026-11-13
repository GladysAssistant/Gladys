const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon').createSandbox();

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
const conbee3ConfigFilePath = path.join(configBasePath, 'z2m_adapter-deconz-conbee3_config.yaml');
const emberConfigFilePath = path.join(configBasePath, 'z2m_adapter-ember_config.yaml');
const ezspConfigFilePath = path.join(configBasePath, 'z2m_adapter-ezsp_config.yaml');
const portConfigFilePath = path.join(configBasePath, 'z2m_port_config.yaml');
const networkAdapterConfigFilePath = path.join(configBasePath, 'z2m_network-adapter_config.yaml');
const onboardingConfigFilePath = path.join(configBasePath, 'z2m_onboarding_config.yaml');
const usedOnboardingConfigFilePath = path.join(configBasePath, 'z2m_onboarding-used_config.yaml');
const restoredConfigFilePath = path.join(configBasePath, 'z2m_restored_config.yaml');
const coordinatorBackupConfigFilePath = path.join(configBasePath, 'z2m_coordinator-backup_config.yaml');
const configFolder = path.dirname(configFilePath);
const coordinatorBackupFilePath = path.join(configFolder, 'coordinator_backup.json');
// Written by zigbee-herdsman 10.10 (open coordinator backup format)
const coordinatorBackup = {
  pan_id: 'cbac',
  extended_pan_id: '79a72f8e5058b222',
  channel: 15,
  network_key: { key: '181b15952df956b87a22e8560fb15b98', sequence_number: 0, frame_counter: 1234 },
};
const setAsideFiles = () =>
  fs.readdirSync(configFolder).filter((file) => file.startsWith('configuration.yaml.invalid-'));

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
      variable: {
        // By default, a first installation
        getValue: fake.resolves(null),
        setValue: fake.resolves(null),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    // By default, no Z2M backup to restore
    zigbee2mqttManager.restoreZ2mBackup = fake.resolves(null);

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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
    assert.calledOnce(portfinderMock.getPortPromise);
    // Asking Zigbee2mqtt to draw the network settings, after looking for a backup
    expect(resultContent).to.include('network_key: GENERATE');
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder);
    assert.calledOnceWithExactly(gladys.variable.setValue, 'Z2M_NETWORK_GENERATED', 'true', serviceId);
  });

  it('it should write no network settings for a network formed before Gladys asked for them to be drawn', async () => {
    // PREPARE
    // Zigbee2mqtt installed by an earlier start, network settings never drawn
    gladys.variable.getValue = fake((key) => Promise.resolve(key === 'DOCKER_Z2M_VERSION' ? '13' : null));
    const config = {};
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    // Zigbee2mqtt comes back on this network
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs
      .readFileSync(defaultConfigFilePath, 'utf8')
      .replace('advanced:\n  network_key: GENERATE\n  pan_id: GENERATE\n  ext_pan_id: GENERATE\n', '');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
    assert.notCalled(gladys.variable.setValue);
  });

  it('it should ask Zigbee2mqtt to draw new settings for a network drawn before, lost with its backups', async () => {
    // PREPARE
    gladys.variable.getValue = fake((key) =>
      Promise.resolve({ DOCKER_Z2M_VERSION: '13', Z2M_NETWORK_GENERATED: 'true' }[key] || null),
    );
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
  });

  it('it should restore the Z2M backup when the configuration file is missing', async () => {
    // PREPARE
    // Holds the network settings drawn by Zigbee2mqtt when it formed its network
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder);
  });

  it('it should take the network settings of the coordinator backup over those of the restored Z2M backup', async () => {
    // PREPARE
    // The channel was changed after the Z2M backup: the coordinator backup holds the current network
    fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify(coordinatorBackup));
    // The Z2M backup was taken on channel 11
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      const restoredContent = fs
        .readFileSync(restoredConfigFilePath, 'utf8')
        .replace('frontend:', '  channel: 11\nfrontend:');
      fs.writeFileSync(path.join(folder, 'configuration.yaml'), restoredContent);
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    // Channel 15, from the coordinator backup
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(coordinatorBackupConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should restore the Z2M backup again, with the coordinator settings, after the coordinator backup could not be read', async () => {
    // PREPARE
    // Not a file: reading it fails, as for a file without read permission
    fs.mkdirSync(coordinatorBackupFilePath);
    // The Z2M backup was taken on channel 11
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      const restoredContent = fs
        .readFileSync(restoredConfigFilePath, 'utf8')
        .replace('frontend:', '  channel: 11\nfrontend:');
      fs.writeFileSync(path.join(folder, 'configuration.yaml'), restoredContent);
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('EISDIR');
    // Not kept without the coordinator settings
    expect(fs.existsSync(configFilePath)).to.equal(false);

    // PREPARE
    // The coordinator backup can be read again, it holds channel 15
    fs.rmdirSync(coordinatorBackupFilePath);
    fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify(coordinatorBackup));
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    assert.calledTwice(zigbee2mqttManager.restoreZ2mBackup);
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(coordinatorBackupConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should not keep the configuration file of a Z2M backup restored in part', async () => {
    // PREPARE
    // The configuration file is written, another file of the backup is not (disk full)
    const writeError = new Error('ENOSPC: no space left on device');
    writeError.code = 'ENOSPC';
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
      throw writeError;
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('ENOSPC');
    expect(fs.existsSync(configFilePath)).to.equal(false);
  });

  it('it should set aside a configuration file zeroed by a power cut, and restore the Z2M backup in its place', async () => {
    // PREPARE
    // Read by YAML as a string
    fs.writeFileSync(configFilePath, Buffer.alloc(16));
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      if (!fs.existsSync(path.join(folder, 'configuration.yaml'))) {
        fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
      }
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    expect(setAsideFiles()).to.have.lengthOf(1);
    expect(fs.readFileSync(path.join(configFolder, setAsideFiles()[0]))).to.deep.equal(Buffer.alloc(16));
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should set aside a configuration file that is not YAML, and restore the Z2M backup in its place', async () => {
    // PREPARE
    // Left by a write cut short in a quoted value
    const invalidContent =
      "homeassistant: false\nmap_options:\n  graphviz:\n    colors:\n      fill:\n        enddevice: '#fff8";
    fs.writeFileSync(configFilePath, invalidContent);
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    expect(setAsideFiles()).to.have.lengthOf(1);
    expect(fs.readFileSync(path.join(configFolder, setAsideFiles()[0]), 'utf8')).to.equal(invalidContent);
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should keep a configuration file set aside before when it sets aside another one', async () => {
    // PREPARE
    const earlierSetAside = 'configuration.yaml.invalid-2026-11-01T00-00-00.000Z';
    fs.writeFileSync(path.join(configFolder, earlierSetAside), 'earlier');
    fs.writeFileSync(configFilePath, Buffer.alloc(16));
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    expect(setAsideFiles()).to.have.lengthOf(2);
    expect(fs.readFileSync(path.join(configFolder, earlierSetAside), 'utf8')).to.equal('earlier');
  });

  it('it should leave the configuration file whole when it cannot be written again', async () => {
    // PREPARE
    fs.copyFileSync(mqttConfigFilePath, configFilePath);
    // The disk is full: the file written is cut short
    const writeError = new Error('ENOSPC: no space left on device');
    writeError.code = 'ENOSPC';
    const writeFile = fake(async (filePath) => {
      await fsPromises.writeFile(filePath, 'cut');
      throw writeError;
    });
    const { configureContainer: configureOnFullDisk } = proxyquire(
      '../../../../services/zigbee2mqtt/lib/configureContainer',
      {
        portfinder: portfinderMock,
        'fs/promises': { ...fsPromises, writeFile },
      },
    );
    const config = {
      mqttUsername: 'other-username',
      mqttPassword: 'other-password',
    };
    // EXECUTE
    const promise = configureOnFullDisk.call(zigbee2mqttManager, basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('ENOSPC');
    expect(fs.readFileSync(configFilePath, 'utf8')).to.equal(fs.readFileSync(mqttConfigFilePath, 'utf8'));
    // Nothing left behind
    expect(fs.readdirSync(configFolder)).to.deep.equal(['configuration.yaml']);
  });

  it('it should write the configuration file of two calls at once', async () => {
    // PREPARE
    fs.copyFileSync(mqttConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'other-username',
      mqttPassword: 'other-password',
    };
    // EXECUTE
    await Promise.all([
      zigbee2mqttManager.configureContainer(basePathOnContainer, { ...config }),
      zigbee2mqttManager.configureContainer(basePathOnContainer, { ...config }),
    ]);
    // ASSERT
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include('user: other-username');
    expect(fs.readdirSync(configFolder)).to.deep.equal(['configuration.yaml']);
  });

  it('it should not replace a configuration file Gladys cannot read', async () => {
    // PREPARE
    // Not a file: reading it fails, as for a file without read permission
    fs.mkdirSync(configFilePath);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('EISDIR');
    expect(fs.statSync(configFilePath).isDirectory()).to.equal(true);
    assert.notCalled(zigbee2mqttManager.restoreZ2mBackup);
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should replace a file waiting for the onboarding of Zigbee2mqtt', async () => {
    // PREPARE
    // Written by Zigbee2mqtt 2.14 started without configuration file
    fs.copyFileSync(onboardingConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    // Same file as if there was none: no onboarding, the broker of Gladys
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(mqttConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder);
  });

  it('it should keep the network settings of the coordinator backup left by Zigbee2mqtt, without Z2M backup', async () => {
    // PREPARE
    fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify(coordinatorBackup));
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(coordinatorBackupConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  const unusableCoordinatorBackups = {
    'not JSON': '{',
    'without network key': JSON.stringify({ ...coordinatorBackup, network_key: null }),
    'with a short network key': JSON.stringify({ ...coordinatorBackup, network_key: { key: '0103' } }),
    'with a short extended PAN ID': JSON.stringify({ ...coordinatorBackup, extended_pan_id: '' }),
    'with a PAN ID that is not hexadecimal': JSON.stringify({ ...coordinatorBackup, pan_id: 'zz' }),
    'with a PAN ID 0': JSON.stringify({ ...coordinatorBackup, pan_id: '0' }),
    'with a PAN ID 0xFFFF': JSON.stringify({ ...coordinatorBackup, pan_id: 'ffff' }),
    'with a channel that is not a number': JSON.stringify({ ...coordinatorBackup, channel: '15' }),
    'with a channel below 11': JSON.stringify({ ...coordinatorBackup, channel: 10 }),
    'with a channel above 26': JSON.stringify({ ...coordinatorBackup, channel: 27 }),
  };
  Object.entries(unusableCoordinatorBackups).forEach(([description, content]) => {
    it(`it should not write the configuration file with a coordinator backup ${description}`, async () => {
      // PREPARE
      // There is a network on the coordinator: other settings would make Zigbee2mqtt leave it
      fs.writeFileSync(coordinatorBackupFilePath, content);
      const config = {
        mqttUsername: 'mqtt-username',
        mqttPassword: 'mqtt-password',
      };
      // EXECUTE
      const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
      // ASSERT
      await expect(promise).to.be.rejectedWith('does not hold the settings of the Zigbee network');
      expect(fs.existsSync(configFilePath)).to.equal(false);
      assert.notCalled(gladys.variable.setValue);
    });
  });

  it('it should restore the Z2M backup in place of an empty configuration file', async () => {
    // PREPARE
    // Left by a write cut short
    fs.writeFileSync(configFilePath, '');
    // Skips the restore when a configuration file is there
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      if (!fs.existsSync(path.join(folder, 'configuration.yaml'))) {
        fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
      }
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should keep the network settings drawn by Zigbee2mqtt when it writes the file again', async () => {
    // PREPARE
    fs.copyFileSync(restoredConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'other-mqtt-username',
      mqttPassword: 'other-mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs
      .readFileSync(restoredConfigFilePath, 'utf8')
      .replace('user: mqtt-username', 'user: other-mqtt-username')
      .replace('password: mqtt-password', 'password: other-mqtt-password');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should restore the Z2M backup in place of a file waiting for the onboarding of Zigbee2mqtt', async () => {
    // PREPARE
    fs.copyFileSync(onboardingConfigFilePath, configFilePath);
    // Skips the restore when a configuration file is there
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      if (!fs.existsSync(path.join(folder, 'configuration.yaml'))) {
        fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
      }
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should keep a used file flagged for the onboarding of Zigbee2mqtt', async () => {
    // PREPARE
    // Flag set by hand on a file of Gladys whose network already started: it must be kept
    fs.copyFileSync(usedOnboardingConfigFilePath, configFilePath);
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(usedOnboardingConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
    assert.notCalled(zigbee2mqttManager.restoreZ2mBackup);
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
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
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
  });

  it('it should only add serial adapter (ember)', async () => {
    // PREPARE
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(emberConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should only add serial adapter (legacy ezsp)', async () => {
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should update adapter to ember when user switches from legacy ezsp to ember dongle', async () => {
    // PREPARE - existing config has adapter: ezsp (user had a legacy ezsp dongle)
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(emberConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should set default adapter to zstack', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {};
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should set default adapt to zstack', async () => {
    // PREPARE
    fs.copyFileSync(ezspConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.ZSTACK][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(defaultConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
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
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should set the ConBee III baudrate', async () => {
    // PREPARE
    const config = {
      z2mDongleName: 'ConBee III',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(conbee3ConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should keep the ConBee III configuration', async () => {
    // PREPARE
    fs.copyFileSync(conbee3ConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: 'ConBee III',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(conbee3ConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
  });

  it('it should update the baudrate when switching from a ConBee III to a ConBee II', async () => {
    // PREPARE
    fs.copyFileSync(conbee3ConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: 'ConBee II',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(deconzConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should remove the baudrate when switching from a ConBee III to another adapter', async () => {
    // PREPARE
    fs.copyFileSync(conbee3ConfigFilePath, configFilePath);
    const config = {
      z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0],
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(emberConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should remove the baudrate when switching from a ConBee III to a network coordinator', async () => {
    // PREPARE
    fs.copyFileSync(conbee3ConfigFilePath, configFilePath);
    const config = {
      z2mAdapterMode: 'network',
      z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638',
      z2mNetworkAdapterType: 'ember',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(networkAdapterConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should configure a network coordinator', async () => {
    // PREPARE
    const config = {
      z2mAdapterMode: 'network',
      z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638',
      z2mNetworkAdapterType: 'ember',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(networkAdapterConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should keep the network coordinator configuration', async () => {
    // PREPARE
    fs.copyFileSync(networkAdapterConfigFilePath, configFilePath);
    const config = {
      z2mAdapterMode: 'network',
      z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638',
      z2mNetworkAdapterType: 'ember',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(networkAdapterConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
  });

  it('it should use the default adapter for a network coordinator without type', async () => {
    // PREPARE
    const config = { z2mAdapterMode: 'network', z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638' };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    expect(resultContent).to.contain('serial:\n  port: tcp://192.168.1.20:6638\n  adapter: zstack\n');
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  it('it should restore the USB serial port when switching back from a network coordinator', async () => {
    // PREPARE
    fs.copyFileSync(networkAdapterConfigFilePath, configFilePath);
    const config = { z2mAdapterMode: 'usb', z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0] };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(emberConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });

  ['socket://192.168.1.20:6638', 'MDNS://slzb-06', 'mdns://slzb-06'].forEach((networkSerialPort) => {
    it(`it should restore the USB serial port when switching back from "${networkSerialPort}"`, async () => {
      // PREPARE
      const networkConfigContent = fs.readFileSync(networkAdapterConfigFilePath, 'utf8');
      fs.writeFileSync(configFilePath, networkConfigContent.replace('tcp://192.168.1.20:6638', networkSerialPort));
      const config = { z2mAdapterMode: 'usb', z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0] };
      // EXECUTE
      const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
      // ASSERT
      const resultContent = fs.readFileSync(configFilePath, 'utf8');
      const expectedContent = fs.readFileSync(emberConfigFilePath, 'utf8');
      expect(resultContent).to.equal(expectedContent);
      expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
    });
  });

  it('it should reset a serial port that is not the one bound in the container (host path of the dongle)', async () => {
    // PREPARE
    const emberContent = fs.readFileSync(emberConfigFilePath, 'utf8');
    fs.writeFileSync(configFilePath, emberContent.replace('/dev/ttyACM0', '/dev/ttyUSB0'));
    const config = { z2mAdapterMode: 'usb', z2mDongleName: ADAPTERS_BY_CONFIG_KEY[CONFIG_KEYS.EMBER][0] };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    expect(resultContent).to.equal(emberContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
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
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
  });
});
