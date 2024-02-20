const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const exampleData = require('./exampleData.json');

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

describe('zwaveJSUIHandler.onNewDeviceDiscover.js', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should set list of Gladys devices', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    await zwaveJSUIHandler.onNewDeviceDiscover(exampleData);
    expect(zwaveJSUIHandler.devices).to.deep.equal([
      {
        name: 'capteur-ouverture',
        external_id: 'zwavejs-ui:2',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [
          {
            category: 'opening-sensor',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: true,
            has_feedback: true,
            name: '2-113-0-Access Control-Door state (simple)',
            command_class: 113,
            command_class_name: 'Notification',
            command_class_version: 5,
            endpoint: 0,
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
            node_id: 2,
            property_name: 'Access Control',
            property_key_name: 'Door state (simple)',
          },
        ],
      },
    ]);
  });
});
