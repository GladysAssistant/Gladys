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
      system: {
        // By default, no container yet
        getContainers: fake.resolves([]),
        stopContainer: fake.resolves(null),
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
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, []);
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
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, []);
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

  it('it should write the configuration file, with the coordinator settings, once the coordinator backup can be read again', async () => {
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
    assert.notCalled(zigbee2mqttManager.restoreZ2mBackup);
    expect(fs.existsSync(configFilePath)).to.equal(false);

    // PREPARE
    // The coordinator backup can be read again, it holds channel 15
    fs.rmdirSync(coordinatorBackupFilePath);
    fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify(coordinatorBackup));
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(coordinatorBackupConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should not keep a restored configuration file that the coordinator settings were not given', async () => {
    // PREPARE
    fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify({ ...coordinatorBackup, channel: 27 }));
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('does not hold the settings of the Zigbee network');
    // Restored again by the next start
    expect(fs.existsSync(configFilePath)).to.equal(false);
  });

  it('it should not keep a restored configuration file when the restored coordinator backup cannot be read', async () => {
    // PREPARE
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(restoredConfigFilePath, path.join(folder, 'configuration.yaml'));
      // Not a file: reading it fails, as for a file restored without read permission
      fs.mkdirSync(path.join(folder, 'coordinator_backup.json'));
    });
    const config = {};
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('EISDIR');
    expect(fs.existsSync(configFilePath)).to.equal(false);
  });

  it('it should not keep the onboarding file written by Zigbee2mqtt while its backup was restored', async () => {
    // PREPARE
    // Started by a concurrent call, Zigbee2mqtt writes its onboarding file before the configuration file of the backup
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder) => {
      fs.copyFileSync(onboardingConfigFilePath, path.join(folder, 'configuration.yaml'));
    });
    const config = {};
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('Zigbee2mqtt wrote its onboarding file while its backup was restored');
    // Restored again by the next start
    expect(fs.existsSync(configFilePath)).to.equal(false);
    assert.notCalled(gladys.variable.setValue);
  });

  it('it should stop Zigbee2mqtt before restoring its backup', async () => {
    // PREPARE
    // Restarted in a loop by Docker on a configuration file it cannot read
    gladys.system.getContainers = fake.resolves([
      {
        id: 'z2m-container-id',
        name: '/gladys-z2m-zigbee2mqtt',
        state: 'restarting',
        labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
      },
    ]);
    const config = {};
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.stopContainer, 'z2m-container-id');
    assert.callOrder(gladys.system.stopContainer, zigbee2mqttManager.restoreZ2mBackup);
  });

  it('it should restore the Z2M backup in place of a configuration file zeroed by a power cut', async () => {
    // PREPARE
    fs.writeFileSync(configFilePath, Buffer.alloc(16));
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
    // Holds nothing to keep
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, []);
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  it('it should replace a configuration file that is not YAML with the one of the Z2M backup', async () => {
    // PREPARE
    // Left by a write cut short in a quoted value
    const invalidContent =
      "homeassistant: false\nmap_options:\n  graphviz:\n    colors:\n      fill:\n        enddevice: '#fff8";
    fs.writeFileSync(configFilePath, invalidContent);
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder, filesToReplace) => {
      if (filesToReplace.includes('configuration.yaml')) {
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
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, ['configuration.yaml']);
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(restoredConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: false });
  });

  // Edited by hand, the file may hold the only copy of the network settings
  const recoveriesWithoutZ2mBackup = {
    'for a network drawn by Zigbee2mqtt': () => {
      gladys.variable.getValue = fake((key) =>
        Promise.resolve({ DOCKER_Z2M_VERSION: '13', Z2M_NETWORK_GENERATED: 'true' }[key] || null),
      );
    },
    'with a coordinator backup': () => {
      fs.writeFileSync(coordinatorBackupFilePath, JSON.stringify(coordinatorBackup));
    },
  };
  Object.entries(recoveriesWithoutZ2mBackup).forEach(([description, prepare]) => {
    it(`it should leave a configuration file that is not YAML in place without Z2M backup, ${description}`, async () => {
      // PREPARE
      prepare();
      const invalidContent = 'homeassistant: false\nadvanced:\n  network_key: [1, 3\n';
      fs.writeFileSync(configFilePath, invalidContent);
      const config = {};
      // EXECUTE
      const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
      // ASSERT
      await expect(promise).to.be.rejectedWith('configuration.yaml is not valid YAML, fix it then restart Gladys');
      expect(fs.readFileSync(configFilePath, 'utf8')).to.equal(invalidContent);
      assert.notCalled(gladys.variable.setValue);
    });
  });

  it('it should leave a configuration file that is not YAML in place when the Z2M backup cannot be restored', async () => {
    // PREPARE
    const invalidContent = 'homeassistant: false\nmqtt: [';
    fs.writeFileSync(configFilePath, invalidContent);
    const writeError = new Error('ENOSPC: no space left on device');
    writeError.code = 'ENOSPC';
    zigbee2mqttManager.restoreZ2mBackup = fake.rejects(writeError);
    const config = {};
    // EXECUTE
    const promise = zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    await expect(promise).to.be.rejectedWith('ENOSPC');
    expect(fs.readFileSync(configFilePath, 'utf8')).to.equal(invalidContent);
  });

  it('it should replace a coordinator backup cut short with the one of the Z2M backup', async () => {
    // PREPARE
    // Zeroed with the configuration file (a disk full)
    fs.writeFileSync(coordinatorBackupFilePath, '');
    zigbee2mqttManager.restoreZ2mBackup = fake(async (folder, filesToReplace) => {
      if (filesToReplace.includes('coordinator_backup.json')) {
        fs.writeFileSync(path.join(folder, 'coordinator_backup.json'), JSON.stringify(coordinatorBackup));
      }
    });
    const config = {
      mqttUsername: 'mqtt-username',
      mqttPassword: 'mqtt-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, ['coordinator_backup.json']);
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    const expectedContent = fs.readFileSync(coordinatorBackupConfigFilePath, 'utf8');
    expect(resultContent).to.equal(expectedContent);
    expect(changed).to.deep.equal({ configChanged: true, adapterChanged: true });
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

  // Restricted by the user, or opened to a group (wider than the umask)
  ['600', '664'].forEach((permissions) => {
    it(`it should keep the permissions ${permissions} of the configuration file when it writes it again`, async () => {
      // PREPARE
      fs.copyFileSync(mqttConfigFilePath, configFilePath);
      fs.chmodSync(configFilePath, Number.parseInt(permissions, 8));
      const config = {
        mqttUsername: 'other-username',
        mqttPassword: 'other-password',
      };
      // EXECUTE
      await zigbee2mqttManager.configureContainer(basePathOnContainer, config);
      // ASSERT
      expect(fs.readFileSync(configFilePath, 'utf8')).to.include('user: other-username');
      // Windows only keeps the write permission
      if (process.platform !== 'win32') {
        expect(fs.statSync(configFilePath).mode.toString(8)).to.match(new RegExp(`${permissions}$`));
      }
    });
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

  it('it should write the port saved on setup over the port of an existing file', async () => {
    // PREPARE
    // Installed with the port 12000, then another port saved on the setup page
    fs.copyFileSync(defaultConfigFilePath, configFilePath);
    const config = {
      z2mTcpPort: '12001',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    expect(resultContent).to.include('frontend:\n  enabled: true\n  port: 12001\n');
    expect(changed.configChanged).to.equal(true);
    expect(config.z2mTcpPort).to.equal('12001');
    assert.notCalled(portfinderMock.getPortPromise);
  });

  it('it should keep the other settings of the interface when its port changes', async () => {
    // PREPARE
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(configFilePath, content.replace('  port: 12000\n', '  port: 12000\n  host: 0.0.0.0\n'));
    const config = {
      z2mTcpPort: '12001',
    };
    // EXECUTE
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    expect(resultContent).to.include('frontend:\n  enabled: true\n  port: 12001\n  host: 0.0.0.0\n');
  });

  it('it should enable the interface of a file written before Zigbee2mqtt 2, keeping its port on start', async () => {
    // PREPARE
    // Written by an earlier Gladys, without enabling the interface; its port changed by hand since Gladys saved it
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(configFilePath, content.replace('  enabled: true\n  port: 12000\n', '  port: 12000\n'));
    const config = {
      z2mTcpPort: '12001',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    const resultContent = fs.readFileSync(configFilePath, 'utf8');
    expect(resultContent).to.include('frontend:\n  enabled: true\n  port: 12000\n');
    // Restarted once to serve its interface
    expect(changed.configChanged).to.equal(true);
    expect(config.z2mTcpPort).to.equal(12000);
    assert.notCalled(portfinderMock.getPortPromise);
  });

  it('it should keep the interface off when the user turned it off by hand', async () => {
    // PREPARE
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(
      configFilePath,
      content.replace('  enabled: true\n  port: 12000\n', '  enabled: false\n  port: 12000\n'),
    );
    const config = {
      z2mTcpPort: '12000',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    expect(changed.configChanged).to.equal(false);
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include('frontend:\n  enabled: false\n  port: 12000\n');
  });

  it('it should keep the interface off when its port changes', async () => {
    // PREPARE
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(
      configFilePath,
      content.replace('  enabled: true\n  port: 12000\n', '  enabled: false\n  port: 12000\n'),
    );
    const config = {
      z2mTcpPort: '12001',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // ASSERT
    expect(changed.configChanged).to.equal(true);
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include('frontend:\n  enabled: false\n  port: 12001\n');
  });

  it('it should not change the file for the port it already holds, saved as text by Gladys', async () => {
    // PREPARE
    const config = {
      z2mTcpPort: '9999',
    };
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // ASSERT
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include('frontend:\n  enabled: true\n  port: 9999\n');
  });

  it('it should write the password of the interface kept by Gladys', async () => {
    // PREPARE
    // Installed before the interface had a password
    fs.copyFileSync(defaultConfigFilePath, configFilePath);
    const config = {
      z2mTcpPort: '12000',
      z2mFrontendAuthToken: 'gladys-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    // Restarted once to ask for it
    expect(changed.configChanged).to.equal(true);
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include(
      'frontend:\n  enabled: true\n  port: 12000\n  auth_token: gladys-password\n',
    );
    expect(config.z2mFrontendAuthToken).to.equal('gladys-password');
  });

  it('it should not change the file for the password of the interface it already holds', async () => {
    // PREPARE
    const config = {
      z2mTcpPort: '12000',
      z2mFrontendAuthToken: 'gladys-password',
    };
    await zigbee2mqttManager.configureContainer(basePathOnContainer, config, true);
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    expect(changed).to.deep.equal({ configChanged: false, adapterChanged: false });
  });

  it('it should keep the password of the interface written by hand, and give it to Gladys', async () => {
    // PREPARE
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(configFilePath, content.replace('  port: 12000\n', '  port: 12000\n  auth_token: my-password\n'));
    const config = {
      z2mTcpPort: '12000',
      z2mFrontendAuthToken: 'gladys-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    expect(changed.configChanged).to.equal(false);
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include('  auth_token: my-password\n');
    expect(config.z2mFrontendAuthToken).to.equal('my-password');
  });

  it('it should keep a password of the interface read from another file, unknown to Gladys', async () => {
    // PREPARE
    const content = fs.readFileSync(defaultConfigFilePath, 'utf8');
    fs.writeFileSync(
      configFilePath,
      content.replace('  port: 12000\n', "  port: 12000\n  auth_token: '!secret.yaml auth_token'\n"),
    );
    const config = {
      z2mTcpPort: '12000',
      z2mFrontendAuthToken: 'gladys-password',
    };
    // EXECUTE
    const changed = await zigbee2mqttManager.configureContainer(basePathOnContainer, config, false);
    // ASSERT
    expect(changed.configChanged).to.equal(false);
    expect(fs.readFileSync(configFilePath, 'utf8')).to.include("  auth_token: '!secret.yaml auth_token'\n");
    expect(config.z2mFrontendAuthToken).to.equal(null);
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
    assert.calledOnceWithExactly(zigbee2mqttManager.restoreZ2mBackup, configFolder, []);
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
    // Not replaced without Z2M backup
    'not JSON': '{',
    'cut short': '',
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
    assert.notCalled(gladys.system.stopContainer);
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
