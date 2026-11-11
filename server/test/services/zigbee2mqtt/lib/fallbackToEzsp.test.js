const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const DONGLE_E = 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"';

describe('zigbee2mqtt fallbackToEzsp', () => {
  let zigbee2mqttManager;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, {}, serviceId);
    zigbee2mqttManager.saveOrDestroyVariable = fake.resolves(null);
    zigbee2mqttManager.installZ2mContainer = fake.resolves(null);
    zigbee2mqttManager.z2mContainerError = { code: 'EZSP_PROTOCOL_VERSION', message: null };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should switch a USB dongle to its legacy ezsp model and install Zigbee2mqtt again', async () => {
    const config = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E, mqttPassword: 'generated-by-init' };
    zigbee2mqttManager.installedConfig = config;
    let stateDuringInstall;
    zigbee2mqttManager.installZ2mContainer = fake(async () => {
      stateDuringInstall = {
        ezspFallback: zigbee2mqttManager.ezspFallback,
        z2mContainerError: zigbee2mqttManager.z2mContainerError,
      };
    });

    await zigbee2mqttManager.fallbackToEzsp();

    // Shown as starting while it installs, announced to the setup page only once installed
    expect(stateDuringInstall).to.deep.equal({ ezspFallback: false, z2mContainerError: null });
    expect(config.z2mDongleName).to.equal(`${DONGLE_E} (legacy ezsp)`);
    assert.calledOnceWithExactly(
      zigbee2mqttManager.saveOrDestroyVariable,
      'ZIGBEE_DONGLE_NAME',
      `${DONGLE_E} (legacy ezsp)`,
    );
    // The configuration of init, with its credentials, only the model changed
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    expect(zigbee2mqttManager.ezspFallback).to.equal(true);
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should switch a USB dongle of an old installation without adapter mode', async () => {
    const config = { z2mAdapterMode: null, z2mDongleName: DONGLE_E };
    zigbee2mqttManager.installedConfig = config;

    await zigbee2mqttManager.fallbackToEzsp();

    expect(config.z2mDongleName).to.equal(`${DONGLE_E} (legacy ezsp)`);
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
  });

  it('should keep the error of a USB dongle without legacy ezsp model', async () => {
    // Sold with a recent firmware: only a firmware update helps
    const config = { z2mAdapterMode: 'usb', z2mDongleName: 'SONOFF Dongle-M' };
    zigbee2mqttManager.installedConfig = config;

    await zigbee2mqttManager.fallbackToEzsp();

    expect(config.z2mDongleName).to.equal('SONOFF Dongle-M');
    assert.notCalled(zigbee2mqttManager.saveOrDestroyVariable);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    expect(zigbee2mqttManager.ezspFallback).to.equal(false);
    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'EZSP_PROTOCOL_VERSION', message: null });
  });

  it('should switch a network coordinator to the ezsp adapter type and install Zigbee2mqtt again', async () => {
    const config = {
      z2mAdapterMode: 'network',
      z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638',
      z2mNetworkAdapterType: 'ember',
    };
    zigbee2mqttManager.installedConfig = config;

    await zigbee2mqttManager.fallbackToEzsp();

    // Also saved by init when it ends, from this same object
    expect(config.z2mNetworkAdapterType).to.equal('ezsp');
    assert.calledOnceWithExactly(zigbee2mqttManager.saveOrDestroyVariable, 'Z2M_NETWORK_ADAPTER_TYPE', 'ezsp');
    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    expect(zigbee2mqttManager.ezspFallback).to.equal(true);
  });

  it('should not switch again a network coordinator already on the ezsp adapter type', async () => {
    // Another reader of the same logs, while the first fallback runs: the shared configuration is already switched
    const config = { z2mAdapterMode: 'network', z2mNetworkAdapterType: 'ezsp' };
    zigbee2mqttManager.installedConfig = config;

    await zigbee2mqttManager.fallbackToEzsp();

    assert.notCalled(zigbee2mqttManager.saveOrDestroyVariable);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    // The error of the ember run is not shown as "no compatibility driver"
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should not switch again a USB dongle already on its legacy ezsp model', async () => {
    zigbee2mqttManager.installedConfig = { z2mAdapterMode: 'usb', z2mDongleName: `${DONGLE_E} (legacy ezsp)` };

    await zigbee2mqttManager.fallbackToEzsp();

    assert.notCalled(zigbee2mqttManager.saveOrDestroyVariable);
    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should show the failure when Zigbee2mqtt fails to install again, without rejecting', async () => {
    // Called while the logs are read in the background: a rejection would be unhandled
    const config = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E };
    zigbee2mqttManager.installedConfig = config;
    zigbee2mqttManager.installZ2mContainer = fake.rejects(new Error('Docker error'));

    await zigbee2mqttManager.fallbackToEzsp();

    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    expect(zigbee2mqttManager.ezspFallback).to.equal(false);
    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: null, message: 'Docker error' });
    // Restored: a later ember error tries the fallback again
    expect(config.z2mDongleName).to.equal(DONGLE_E);
  });

  it('should try again a failed fallback on the next ember error', async () => {
    const config = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E };
    zigbee2mqttManager.installedConfig = config;
    zigbee2mqttManager.installZ2mContainer = fake.rejects(new Error('Docker error'));
    await zigbee2mqttManager.fallbackToEzsp();

    zigbee2mqttManager.installZ2mContainer = fake.resolves(null);
    zigbee2mqttManager.z2mContainerError = { code: 'EZSP_PROTOCOL_VERSION', message: null };
    await zigbee2mqttManager.fallbackToEzsp();

    assert.calledOnceWithExactly(zigbee2mqttManager.installZ2mContainer, config);
    expect(config.z2mDongleName).to.equal(`${DONGLE_E} (legacy ezsp)`);
    expect(zigbee2mqttManager.ezspFallback).to.equal(true);
    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should restore the network adapter type when the fallback fails', async () => {
    const config = { z2mAdapterMode: 'network', z2mNetworkAdapterType: 'ember' };
    zigbee2mqttManager.installedConfig = config;
    zigbee2mqttManager.installZ2mContainer = fake.rejects(new Error('Docker error'));

    await zigbee2mqttManager.fallbackToEzsp();

    assert.calledOnceWithExactly(zigbee2mqttManager.saveOrDestroyVariable, 'Z2M_NETWORK_ADAPTER_TYPE', 'ezsp');
    expect(config.z2mNetworkAdapterType).to.equal('ember');
    expect(zigbee2mqttManager.ezspFallback).to.equal(false);
  });

  it('should not switch again while a fallback is in progress', async () => {
    // Another reader of the same logs during the installation: the configuration is switched until it fails
    const config = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E };
    zigbee2mqttManager.installedConfig = config;
    let secondFallback;
    zigbee2mqttManager.installZ2mContainer = fake(async () => {
      secondFallback = zigbee2mqttManager.fallbackToEzsp();
      await secondFallback;
    });

    await zigbee2mqttManager.fallbackToEzsp();

    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledOnce(zigbee2mqttManager.saveOrDestroyVariable);
  });

  it('should keep the error set by the installation when it fails', async () => {
    zigbee2mqttManager.installedConfig = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E };
    const installError = { code: null, message: 'Container name taken by another container' };
    zigbee2mqttManager.installZ2mContainer = fake(async () => {
      zigbee2mqttManager.z2mContainerError = installError;
      throw new Error('Name taken');
    });

    await zigbee2mqttManager.fallbackToEzsp();

    expect(zigbee2mqttManager.z2mContainerError).to.equal(installError);
  });

  it('should show the failure when the model cannot be saved', async () => {
    zigbee2mqttManager.installedConfig = { z2mAdapterMode: 'usb', z2mDongleName: DONGLE_E };
    zigbee2mqttManager.saveOrDestroyVariable = fake.rejects(new Error('Database locked'));

    await zigbee2mqttManager.fallbackToEzsp();

    assert.notCalled(zigbee2mqttManager.installZ2mContainer);
    expect(zigbee2mqttManager.ezspFallback).to.equal(false);
    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: null, message: 'Database locked' });
  });
});
