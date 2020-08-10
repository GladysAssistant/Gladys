const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const proxiquire = require('proxyquire').noCallThru();

const { MockedMqttClient } = require('../mocks.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { DEFAULT } = require('../../../../services/mqtt/lib/constants');

const execMock = { exec: fake.resolves('command well executed') };
const installContainer = proxiquire('../../../../services/mqtt/lib/installContainer', {
  '../../../utils/childProcess': execMock,
});
const MqttHandler = proxiquire('../../../../services/mqtt/lib', {
  './installContainer': installContainer,
});

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.installContainer', function Describe() {
  this.timeout(8000);
  beforeEach(() => {
    sinon.reset();
  });

  it('should installContainer: pull failed', async () => {
    const error = new Error('error message');
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        getNetworkMode: fake.rejects(error),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    try {
      await mqttHandler.installContainer();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.be.eq(error);
      assert.notCalled(execMock.exec);
      assert.calledOnce(gladys.event.emit);
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
        payload: {
          status: DEFAULT.INSTALLATION_STATUS.ERROR,
          detail: error,
        },
      });
    }
  });

  it('should installContainer: pull success', async () => {
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        pull: fake.resolves(false),
        createContainer: fake.resolves(false),
        getContainers: fake.resolves([{ state: 'running' }]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
      },
      variable: {
        setValue: fake.resolves(true),
        getValue: fake.resolves(true),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    await mqttHandler.installContainer();

    assert.callCount(gladys.variable.setValue, 4);
    assert.calledOnce(execMock.exec);
    assert.calledOnce(gladys.system.pull);
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.getNetworkMode);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.DONE,
      },
    });
  });
});
