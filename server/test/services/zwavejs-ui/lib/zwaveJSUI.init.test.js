const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.init', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init connection', async () => {
    const mqttClient = {
      end: fake.returns(null),
      removeAllListeners: fake.returns(null),
      subscribe: fake.returns(null),
      on: (event, cb) => {
        if (event === 'connect') {
          cb();
        }
      },
    };
    const mqttLibrary = {
      connect: fake.returns(mqttClient),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, mqttLibrary, serviceId);
    await zwaveJSUIHandler.init();
    assert.calledThrice(gladys.variable.getValue);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJS_UI.CONNECTED,
    });
  });
});
