const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const DRIVER_PATH = '/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1234567890-if00-port0';
const dongle = { port: { path: '/dev/ttyUSB0' }, stablePath: DRIVER_PATH };

describe('zigbee2mqtt watchDongle', () => {
  let manager;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    manager = new Zigbee2mqttManager({ job: { wrapper: (type, func) => func } }, {}, serviceId);
    manager.findDongle = sinon.stub().resolves(null);
    manager.init = sinon.stub().resolves();
    manager.emitStatusEvent = sinon.stub();
    manager.usbConfigured = true;
  });

  afterEach(() => {
    manager.stopWatchingDongle();
    clock.restore();
  });

  it('should tell once that the dongle is unplugged, while Zigbee2mqtt does not answer', async () => {
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(9999);
    sinon.assert.notCalled(manager.findDongle);
    await clock.tickAsync(1);
    sinon.assert.calledOnceWithExactly(manager.findDongle, DRIVER_PATH);
    expect(manager.dongleMissing).to.equal(true);
    expect(manager.usbConfigured).to.equal(false);
    sinon.assert.calledOnce(manager.emitStatusEvent);
    // Checked again, told only once
    await clock.tickAsync(10000);
    sinon.assert.calledTwice(manager.findDongle);
    sinon.assert.calledOnce(manager.emitStatusEvent);
  });

  it('should not list the ports while Zigbee2mqtt answers', async () => {
    manager.zigbee2mqttConnected = true;
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(30000);
    sinon.assert.notCalled(manager.findDongle);
    expect(manager.dongleWatchTimer).to.not.equal(null);
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
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    sinon.assert.calledOnceWithExactly(manager.init);
  });

  it('should do nothing while the dongle is there', async () => {
    manager.findDongle.resolves(dongle);
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(20000);
    sinon.assert.calledTwice(manager.findDongle);
    sinon.assert.notCalled(manager.init);
    sinon.assert.notCalled(manager.emitStatusEvent);
  });

  it('should not watch again once the init it started watches', async () => {
    manager.dongleMissing = true;
    manager.findDongle.resolves(dongle);
    manager.init = sinon.fake(async () => {
      manager.watchDongle(DRIVER_PATH);
    });
    manager.watchDongle(DRIVER_PATH);
    await clock.tickAsync(10000);
    // Only the watch of the init remains
    expect(clock.countTimers()).to.equal(1);
  });

  it('should have no effect when stopped during a check', async () => {
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
});
