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
        selector: `zwavejs-ui:2`,
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [
          {
            category: 'temperature-sensor',
            command_class: 49,
            command_class_name: 'Multilevel Sensor',
            command_class_version: 5,
            endpoint: 0,
            external_id: 'zwavejs-ui:2:0:multilevel_sensor:air_temperature',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 150,
            min: -100,
            name: '2-49-0-Air temperature',
            node_id: 2,
            property_key_name: undefined,
            property_name: 'Air temperature',
            read_only: true,
            selector: 'zwavejs-ui:2:0:multilevel_sensor:air_temperature',
            type: 'decimal',
            unit: 'celsius',
          },
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
            feature_name: '',
            selector: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
            node_id: 2,
            property_name: 'Access Control',
            property_key_name: 'Door state (simple)',
          },
        ],
        params: [
          {
            name: `location`,
            value: `salon`,
          },
        ],
      },
      {
        external_id: 'zwavejs-ui:5',
        features: [
          {
            category: 'shutter',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 1,
            external_id: 'zwavejs-ui:5:1:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '5-38-1-currentValue:position',
            node_id: 5,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:5:1:multilevel_switch:currentvalue:position',
            type: 'position',
            unit: 'percent',
          },
          {
            category: 'shutter',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 1,
            external_id: 'zwavejs-ui:5:1:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '5-38-1-currentValue:state',
            node_id: 5,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:5:1:multilevel_switch:currentvalue:state',
            type: 'state',
          },
          {
            category: 'shutter',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 2,
            external_id: 'zwavejs-ui:5:2:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '5-38-2-currentValue:position',
            node_id: 5,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:5:2:multilevel_switch:currentvalue:position',
            type: 'position',
            unit: 'percent',
          },
          {
            category: 'shutter',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 2,
            external_id: 'zwavejs-ui:5:2:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '5-38-2-currentValue:state',
            node_id: 5,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:5:2:multilevel_switch:currentvalue:state',
            type: 'state',
          },
        ],
        name: 'Volet Roulant',
        params: [
          {
            name: 'location',
            value: 'salon',
          },
        ],
        selector: 'zwavejs-ui:5',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
      },
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
        ],
        name: 'inter-01',
        params: [
          {
            name: 'location',
            value: '',
          },
        ],
        selector: 'zwavejs-ui:6',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
      },
    ]);
  });
});
