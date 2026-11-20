const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const logger = require('../../../../utils/logger');
const { BadParameters, ConflictError } = require('../../../../utils/coreErrors');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

// Our own containers, each with the id of its name
const ownContainers = (options) =>
  Promise.resolve([
    {
      id: options.filters.name[0],
      name: `/${options.filters.name[0]}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    },
  ]);

describe('zigbee2mqtt start', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      event: {
        emit: fake(),
      },
      variable: {
        destroy: fake.resolves(null),
        getValue: fake.resolves('local'),
      },
      system: {
        getContainers: fake(ownContainers),
        updateContainer: fake.resolves(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.configured = true;
    zigbee2mqttManager.stopped = true;
    zigbee2mqttManager.stoppedAt = '2026-11-17T08:00:00.000Z';
    zigbee2mqttManager.runInstallation = fake.resolves(null);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should forget the stop and start Zigbee2mqtt in an installation, answering at once', async () => {
    // EXECUTE
    await zigbee2mqttManager.start();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.destroy, 'Z2M_STOPPED', serviceId);
    // Started again by Docker after a crash or a restart of the machine
    assert.calledWithExactly(gladys.system.updateContainer, 'gladys-z2m-zigbee2mqtt', {
      RestartPolicy: { Name: 'always' },
    });
    assert.calledWithExactly(gladys.system.updateContainer, 'gladys-z2m-mqtt', { RestartPolicy: { Name: 'always' } });
    expect(zigbee2mqttManager.stopped).to.equal(false);
    expect(zigbee2mqttManager.stoppedAt).to.equal(null);
    expect(zigbee2mqttManager.installation.state).to.equal('running');
    expect(zigbee2mqttManager.installation.kind).to.equal('start');
    // As at the start of Gladys, not as a setup
    assert.calledOnceWithExactly(zigbee2mqttManager.runInstallation, false);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', { payload: { stopped: false, stoppedAt: null } });
  });

  it('should refuse to start what is not set up', async () => {
    // PREPARE
    zigbee2mqttManager.configured = false;
    // EXECUTE
    await expect(zigbee2mqttManager.start()).to.be.rejectedWith(BadParameters);
    // ASSERT
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(zigbee2mqttManager.runInstallation);
  });

  it('should refuse to start while an installation runs', async () => {
    // PREPARE
    zigbee2mqttManager.startInstallation('install');
    // EXECUTE
    await expect(zigbee2mqttManager.start()).to.be.rejectedWith(ConflictError);
    // ASSERT
    assert.notCalled(gladys.variable.destroy);
    expect(zigbee2mqttManager.stopped).to.equal(true);
  });

  it('should tell an init running as busy, not as nothing set up', async () => {
    // PREPARE: init resets configured until it read the configuration
    zigbee2mqttManager.configured = null;
    zigbee2mqttManager.runningOperations = 1;
    // EXECUTE
    await expect(zigbee2mqttManager.start()).to.be.rejectedWith(ConflictError);
    // ASSERT
    assert.notCalled(gladys.variable.destroy);
  });

  it('should forget the stop even when Docker cannot list the containers', async () => {
    // PREPARE
    gladys.system.getContainers = fake.rejects(new Error('docker down'));
    sinon.stub(logger, 'warn');
    // EXECUTE
    await zigbee2mqttManager.start();
    // ASSERT
    expect(zigbee2mqttManager.stopped).to.equal(false);
    expect(zigbee2mqttManager.installation.state).to.equal('running');
    assert.calledOnce(zigbee2mqttManager.runInstallation);
    assert.calledWithMatch(logger.warn, 'Zigbee2mqtt: restart policy of gladys-z2m-zigbee2mqtt not set to "always":');
  });

  it('should leave the containers of ours alone with an external broker', async () => {
    // PREPARE: a former local installation left them, stopped
    gladys.variable.getValue = fake.resolves('external');
    // EXECUTE
    await zigbee2mqttManager.start();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.getValue, 'Z2M_MQTT_MODE', serviceId);
    assert.notCalled(gladys.system.updateContainer);
    expect(zigbee2mqttManager.stopped).to.equal(false);
    assert.calledOnce(zigbee2mqttManager.runInstallation);
  });

  it('should say stopped no longer once forgotten, even when the restart policy then fails', async () => {
    // PREPARE
    const error = new Error('database locked');
    gladys.variable.getValue = fake.rejects(error);
    zigbee2mqttManager.finishInstallation = fake();
    // EXECUTE
    await expect(zigbee2mqttManager.start()).to.be.rejectedWith(error);
    // ASSERT: the variable is gone, the next start of Gladys starts Zigbee2mqtt
    expect(zigbee2mqttManager.stopped).to.equal(false);
    expect(zigbee2mqttManager.stoppedAt).to.equal(null);
  });

  it('should end the installation when the stop cannot be forgotten', async () => {
    // PREPARE
    const error = new Error('database locked');
    gladys.variable.destroy = fake.rejects(error);
    zigbee2mqttManager.finishInstallation = fake();
    // EXECUTE
    await expect(zigbee2mqttManager.start()).to.be.rejectedWith(error);
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, error);
    assert.notCalled(zigbee2mqttManager.runInstallation);
    expect(zigbee2mqttManager.stopped).to.equal(true);
  });

  it('should end the installation when its job fails to start', async () => {
    // PREPARE
    const error = new Error('job not created');
    let failed;
    const jobFailed = new Promise((resolve) => {
      failed = resolve;
    });
    zigbee2mqttManager.runInstallation = fake(() => {
      setImmediate(failed);
      return Promise.reject(error);
    });
    sinon.stub(logger, 'error');
    // EXECUTE
    await zigbee2mqttManager.start();
    await jobFailed;
    // ASSERT
    expect(zigbee2mqttManager.installation.state).to.equal('failed');
    assert.calledWithExactly(logger.error, 'Zigbee2mqtt: start job failed to start:', error);
  });

  it('should not end another installation when its job fails to start after it', async () => {
    // PREPARE
    let reject;
    zigbee2mqttManager.runInstallation = fake(
      () =>
        new Promise((resolve, rejectInstallation) => {
          reject = rejectInstallation;
        }),
    );
    sinon.stub(logger, 'error');
    await zigbee2mqttManager.start();
    // A setup replaced it
    zigbee2mqttManager.finishInstallation(null);
    zigbee2mqttManager.startInstallation('switch');
    // EXECUTE
    reject(new Error('job not created'));
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // ASSERT
    expect(zigbee2mqttManager.installation.state).to.equal('running');
    expect(zigbee2mqttManager.installation.kind).to.equal('switch');
    assert.notCalled(logger.error);
  });
});
