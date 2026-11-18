const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const logger = require('../../../../utils/logger');
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
    // The fake timers and the stubs of the logger
    sinon.restore();
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

  it('should start Zigbee2mqtt when its container is not there, or was never started, the dongle missing at init', async () => {
    manager.gladys.system.getContainers.resolves([]);
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH, undefined, true);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 1);
    manager.resetDongleRestarts();
    manager.gladys.system.getContainers.resolves([z2mContainer('created')]);
    await clock.tickAsync(10000);
    sinon.assert.callCount(manager.init, 2);
    sinon.assert.notCalled(manager.gladys.system.inspectContainer);
  });

  it('should start Zigbee2mqtt when its container is not there, once the dongle is plugged back', async () => {
    manager.gladys.system.getContainers.resolves([]);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
    manager.findDongle.resolves(dongle);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
  });

  it('should leave a container missing to the installation that failed, its dongle never missing', async () => {
    // An installation failed with the dongle plugged in, its download stalled for instance
    manager.findDongle.resolves(dongle);
    manager.gladys.system.getContainers.resolves([]);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    manager.gladys.system.getContainers.resolves([z2mContainer('created')]);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
    expect(manager.dongleMissing).to.equal(false);
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

    it('should take the dongle back on its port, recognized as the configured model, after init found another adapter there', async () => {
      // At the start of Gladys, a teleinfo adapter was on the port of the dongle
      manager.findDongle.resolves({
        port: {
          path: '/dev/ttyUSB0',
          pnpId: 'usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_d65fba180f86ec11bfdf571719c2d21c-if00-port0',
          vendorId: '10c4',
          productId: 'ea60',
        },
      });
      manager.watchDongle(
        '/dev/ttyUSB0',
        'usb-FTDI_FT232R_USB_UART_A1B2C3D4-if00-port0',
        false,
        'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P',
      );
      await clock.tickAsync(10000);
      expect(manager.dongleMissing).to.equal(false);
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
    const error = sinon.stub(logger, 'error');
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
    // Told once a start is still needed after the last one, not as the last one starts
    sinon.assert.notCalled(error);
    await clock.tickAsync(60 * 60 * 1000);
    sinon.assert.callCount(manager.init, 5);
    sinon.assert.calledOnceWithExactly(
      error,
      'Zigbee2mqtt: started 5 times since its USB dongle is plugged in, given up',
    );
  });

  it('should not tell that it gave up when the last start works', async () => {
    const error = sinon.stub(logger, 'error');
    manager.findDongle.resolves(dongle);
    // Four starts made, the last one more than 5 minutes ago
    manager.dongleRestarts = { count: 4, lastAt: -5 * 60 * 1000 };
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    manager.zigbee2mqttConnected = true;
    await clock.tickAsync(60000);
    sinon.assert.notCalled(error);
  });

  it('should count the spacing from the end of the previous start', async () => {
    manager.findDongle.resolves(dongle);
    // A start that takes 5 minutes, a download for instance
    manager.init = sinon.fake(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 5 * 60 * 1000);
        }),
    );
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    // Ended 5 minutes later: the next start waits 30 s more
    await clock.tickAsync(5 * 60 * 1000 + 20000);
    sinon.assert.calledOnce(manager.init);
    await clock.tickAsync(10000);
    sinon.assert.calledTwice(manager.init);
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

  it('should watch again, the dongle lost, when the init it started fails before watching', async () => {
    manager.findDongle.resolves(dongle);
    manager.gladys.system.getContainers.resolves([]);
    manager.init = sinon.fake(async () => {
      manager.stopWatchingDongle();
      throw new Error('Docker not reachable');
    });
    manager.watchDongle(DRIVER_PATH, undefined, true);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    expect(manager.dongleWatch).to.deep.equal({
      driverPath: DRIVER_PATH,
      pnpId: undefined,
      dongleLost: true,
      dongleName: undefined,
    });
    expect(clock.countTimers()).to.equal(1);
    // Tried again, later
    await clock.tickAsync(30000);
    sinon.assert.calledTwice(manager.init);
  });

  it('should try again a start that failed after the init it started watched, the dongle once missing', async () => {
    manager.findDongle.resolves(dongle);
    manager.gladys.system.getContainers.resolves([]);
    // As init: the dongle is found, then the image cannot be downloaded
    manager.init = sinon.fake(async () => {
      manager.watchDongle(DRIVER_PATH, undefined, false);
      throw new Error('No internet');
    });
    manager.watchDongle(DRIVER_PATH, undefined, true);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    expect(manager.dongleWatch.dongleLost).to.equal(true);
    // 30 s after the end of the first start
    await clock.tickAsync(30000);
    sinon.assert.calledTwice(manager.init);
  });

  it('should try again after a short unplug, when the init it started removed the container and failed', async () => {
    // Docker failed to start the container: the dongle was unplugged and plugged back between two checks
    manager.findDongle.resolves(dongle);
    manager.init = sinon.fake(async () => {
      // As init: the dongle is found, the container is removed to be created on its new path, which fails
      manager.watchDongle(DRIVER_PATH, undefined, false);
      manager.gladys.system.getContainers.resolves([]);
      throw new Error('Docker failed to create the container');
    });
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnce(manager.init);
    expect(manager.dongleWatch.dongleLost).to.equal(true);
    await clock.tickAsync(30000);
    sinon.assert.calledTwice(manager.init);
  });

  it('should forget the lost dongle once Zigbee2mqtt answers', async () => {
    manager.findDongle.resolves(dongle);
    manager.zigbee2mqttConnected = true;
    manager.watchDongle(DRIVER_PATH, undefined, true);
    await clock.tickAsync(10000);
    expect(manager.dongleWatch.dongleLost).to.equal(false);
    // Its container removed later, the dongle plugged in: left as it is
    manager.zigbee2mqttConnected = false;
    manager.gladys.system.getContainers.resolves([]);
    await clock.tickAsync(10000);
    sinon.assert.notCalled(manager.init);
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
