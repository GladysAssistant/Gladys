const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const DRIVER_PATH = '/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1234567890-if00-port0';
const dongle = { port: { path: '/dev/ttyUSB0' }, stablePath: DRIVER_PATH, ports: [] };
const z2mContainer = (state) => ({
  id: 'z2m',
  name: '/gladys-z2m-zigbee2mqtt',
  state,
  labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
});

describe('zigbee2mqtt watchDongle', () => {
  let manager;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    const gladys = {
      job: { wrapper: (type, func) => func },
      // Docker gave up starting it: its dongle was missing
      system: {
        getContainers: sinon.stub().resolves([z2mContainer('exited')]),
        inspectContainer: sinon.stub().resolves({
          State: { Error: `error gathering device information while adding custom device "${DRIVER_PATH}"` },
        }),
      },
    };
    manager = new Zigbee2mqttManager(gladys, {}, serviceId);
    manager.findDongle = sinon.stub().resolves(null);
    manager.init = sinon.stub().resolves();
    manager.emitStatusEvent = sinon.stub();
    manager.usbConfigured = true;
  });

  afterEach(() => {
    manager.stopWatchingDongle();
    clock.restore();
  });

  it('should tell once that the dongle is not found, while Zigbee2mqtt does not answer', async () => {
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(9999);
    sinon.assert.notCalled(manager.findDongle);
    await clock.tickAsync(1);
    sinon.assert.calledOnceWithExactly(manager.findDongle, DRIVER_PATH);
    expect(manager.dongleMissing).to.equal(true);
    expect(manager.usbConfigured).to.equal(false);
    sinon.assert.calledOnce(manager.emitStatusEvent);
    // Checked again, told only once, nothing started
    await clock.tickAsync(10000);
    sinon.assert.calledTwice(manager.findDongle);
    sinon.assert.calledOnce(manager.emitStatusEvent);
    sinon.assert.notCalled(manager.gladys.system.getContainers);
    sinon.assert.notCalled(manager.init);
  });

  it('should not list the ports while Zigbee2mqtt answers, and forget the starts made', async () => {
    manager.zigbee2mqttConnected = true;
    manager.dongleRestarts = { count: 5, lastAt: 0 };
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(30000);
    sinon.assert.notCalled(manager.findDongle);
    expect(manager.dongleRestarts).to.deep.equal({ count: 0, lastAt: null });
    expect(manager.dongleWatchTimer).to.not.equal(null);
    sinon.assert.notCalled(manager.emitStatusEvent);
  });

  it('should tell that the dongle is found once Zigbee2mqtt answers', async () => {
    manager.zigbee2mqttConnected = true;
    manager.dongleMissing = true;
    manager.usbConfigured = false;
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    expect(manager.dongleMissing).to.equal(false);
    expect(manager.usbConfigured).to.equal(true);
    sinon.assert.calledOnce(manager.emitStatusEvent);
  });

  it('should leave the dongle to a running installation or operation', async () => {
    manager.installation.state = 'running';
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    manager.installation.state = 'idle';
    manager.runningOperations = 1;
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.findDongle);
  });

  it('should start Zigbee2mqtt again once the dongle is plugged back', async () => {
    manager.dongleMissing = true;
    manager.usbConfigured = false;
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    expect(manager.dongleMissing).to.equal(false);
    expect(manager.usbConfigured).to.equal(true);
    sinon.assert.calledOnce(manager.emitStatusEvent);
    sinon.assert.calledOnceWithExactly(manager.init);
  });

  it('should start Zigbee2mqtt again when the dongle was unplugged and plugged back between two checks', async () => {
    // Never seen missing: its container is stopped all the same
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnceWithExactly(manager.init);
    sinon.assert.notCalled(manager.emitStatusEvent);
  });

  it('should start Zigbee2mqtt when its container is not there, or was never started', async () => {
    manager.gladys.system.getContainers.resolves([]);
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 1);
    manager.resetDongleRestarts();
    manager.gladys.system.getContainers.resolves([z2mContainer('created')]);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 2);
    sinon.assert.notCalled(manager.gladys.system.inspectContainer);
  });

  it('should leave stopped a container stopped by hand, the dongle being flashed from the host', async () => {
    // Cleared by its last successful start
    manager.gladys.system.inspectContainer.resolves({ State: { Error: '' } });
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(20000);
    sinon.assert.calledTwice(manager.gladys.system.inspectContainer);
    sinon.assert.notCalled(manager.init);
  });

  it('should leave to init a container of the user carrying our name', async () => {
    manager.gladys.system.getContainers.resolves([
      { ...z2mContainer('exited'), labels: { 'io.gladysassistant.service': 'node-red' } },
    ]);
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
  });

  describe('dongle stored by its port', () => {
    const DONGLE_PNP_ID = 'usb-Texas_Instruments_TI_CC2531_USB_CDC___0X00124B0018E2FE91-if00';

    it('should not take another USB-serial adapter that took its port for the dongle', async () => {
      manager.findDongle.resolves({
        port: { path: '/dev/ttyUSB0', pnpId: 'usb-RFXCOM_RFXtrx433_A1XZI13O-if00-port0' },
      });
      manager.watchDongle('/dev/ttyUSB0', DONGLE_PNP_ID);
      await clock.tickAsync(10000);
      expect(manager.dongleMissing).to.equal(true);
      sinon.assert.notCalled(manager.init);
    });

    it('should start Zigbee2mqtt again once the dongle is back on its port', async () => {
      manager.findDongle.resolves({ port: { path: '/dev/ttyUSB0', pnpId: DONGLE_PNP_ID } });
      manager.watchDongle('/dev/ttyUSB0', DONGLE_PNP_ID);
      await clock.tickAsync(10000);
      sinon.assert.calledOnce(manager.init);
    });

    it('should take the device on its port when init did not find the dongle', async () => {
      manager.findDongle.resolves({ port: { path: '/dev/ttyUSB0', pnpId: DONGLE_PNP_ID } });
      manager.watchDongle('/dev/ttyUSB0', undefined);
      await clock.tickAsync(10000);
      sinon.assert.calledOnce(manager.init);
    });
  });

  it('should leave a running or restarting container to Docker', async () => {
    manager.dongleMissing = true;
    manager.findDongle.resolves(dongle);
    manager.gladys.system.getContainers.resolves([z2mContainer('running')]);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    manager.gladys.system.getContainers.resolves([z2mContainer('restarting')]);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
    // Found again all the same
    expect(manager.dongleMissing).to.equal(false);
    sinon.assert.calledOnce(manager.emitStatusEvent);
  });

  it('should space out the starts of Zigbee2mqtt, then give up', async () => {
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 1);
    // 30 s after the first start
    await clock.tickAsync(20000);
    sinon.assert.callCount(manager.init, 1);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 2);
    // Then 1, 2 and 5 minutes after the previous one
    await clock.tickAsync(60000);
    sinon.assert.callCount(manager.init, 3);
    await clock.tickAsync(120000);
    sinon.assert.callCount(manager.init, 4);
    await clock.tickAsync(290000);
    sinon.assert.callCount(manager.init, 4);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 5);
    await clock.tickAsync(60 * 60 * 1000);
    sinon.assert.callCount(manager.init, 5);
  });

  it('should start Zigbee2mqtt at once when its dongle is plugged back after a start', async () => {
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 1);
    manager.findDongle.resolves(null);
    await clock.tickAsync(10000);
    manager.findDongle.resolves(dongle);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 2);
  });

  it('should watch again when the init it started fails before watching', async () => {
    manager.findDongle.resolves(dongle);
    manager.init = sinon.fake(async () => {
      manager.stopWatchingDongle();
      throw new Error('Docker not reachable');
    });
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    expect(manager.dongleWatch).to.deep.equal({ driverPath: DRIVER_PATH, pnpId: undefined });
    expect(clock.countTimers()).to.equal(1);
    // Tried again, later
    await clock.tickAsync(30000);
    sinon.assert.calledTwice(manager.init);
  });

  it('should keep the watch of the init it started, when that init fails after watching', async () => {
    manager.findDongle.resolves(dongle);
    let initWatch;
    manager.init = sinon.fake(async () => {
      manager.watchDongle(DRIVER_PATH);
      initWatch = manager.dongleWatch;
      throw new Error('Zigbee2mqtt container failed to start');
    });
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    expect(manager.dongleWatch).to.equal(initWatch);
    expect(clock.countTimers()).to.equal(1);
  });

  it('should not watch again once the init it started watches', async () => {
    manager.findDongle.resolves(dongle);
    manager.init = sinon.fake(async () => {
      manager.watchDongle(DRIVER_PATH);
    });
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    // Only the watch of the init remains
    expect(clock.countTimers()).to.equal(1);
  });

  it('should have no effect when stopped while the ports are listed', async () => {
    let listPorts;
    manager.findDongle = sinon.fake(
      () =>
        new Promise((resolve) => {
          listPorts = resolve;
        }),
    );
    manager.dongleMissing = true;
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    // Disabled meanwhile: Zigbee2mqtt is not started again
    manager.stopWatchingDongle();
    listPorts(dongle);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
    expect(manager.dongleMissing).to.equal(true);
    expect(clock.countTimers()).to.equal(0);
  });

  it('should have no effect when stopped while its container is looked up', async () => {
    let listContainers;
    manager.gladys.system.getContainers = sinon.fake(
      () =>
        new Promise((resolve) => {
          listContainers = resolve;
        }),
    );
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    manager.stopWatchingDongle();
    listContainers([z2mContainer('exited')]);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
    expect(clock.countTimers()).to.equal(0);
  });

  it('should have no effect when an operation starts during a check', async () => {
    let listPorts;
    manager.findDongle = sinon.fake(
      () =>
        new Promise((resolve) => {
          listPorts = resolve;
        }),
    );
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    // A setup sent meanwhile installs Zigbee2mqtt, and checks the dongle itself
    manager.installation.state = 'running';
    listPorts(null);
    await clock.tickAsync(0);
    expect(manager.dongleMissing).to.equal(false);
    sinon.assert.notCalled(manager.emitStatusEvent);
  });

  it('should go on watching when a check fails', async () => {
    manager.findDongle.rejects(new Error('USB service is not available'));
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(20000);
    sinon.assert.calledTwice(manager.findDongle);
  });

  it('should stop watching', async () => {
    manager.watchDongle(DRIVER_PATH);
    manager.stopWatchingDongle();
    expect(manager.dongleWatchTimer).to.equal(null);
    expect(manager.dongleWatch).to.equal(null);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.findDongle);
  });

  it('should forget the starts made', () => {
    manager.dongleRestarts = { count: 3, lastAt: 1000 };
    manager.resetDongleRestarts();
    expect(manager.dongleRestarts).to.deep.equal({ count: 0, lastAt: null });
  });
});
