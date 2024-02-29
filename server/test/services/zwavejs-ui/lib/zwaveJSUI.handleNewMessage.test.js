const sinon = require('sinon');

const { assert, fake } = sinon;

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

describe('zwaveJSUIHandler.handleNewMessage', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save nodes received', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    const data = {
      result: [],
    };
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes',
      JSON.stringify(data),
    );
  });
  it('should not crash even with broken JSON', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.handleNewMessage('zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/getNodes', 'toto');
  });

  it('should call onNodeValueUpdated', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    const sut = sinon.stub(zwaveJSUIHandler, 'onNodeValueUpdated').resolves();
    await zwaveJSUIHandler.handleNewMessage(
      'zwave/_EVENTS/ZWAVE_GATEWAY-zwave-js-ui/node/node_value_updated',
      JSON.stringify({}),
    );

    assert.calledOnce(sut);
  });
});
