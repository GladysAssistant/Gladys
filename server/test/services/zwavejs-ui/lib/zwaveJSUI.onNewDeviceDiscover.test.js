const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const exampleData = require('./exampleData.json');

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

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
        name: '',
        external_id: 'zwavejs-ui:1',
        selector: 'zwavejs-ui:1',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
        features: [],
        params: [{ name: 'location', value: '' }],
      },
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
          {
            category: 'battery',
            type: 'integer',
            min: 0,
            max: 100,
            keep_history: true,
            read_only: true,
            has_feedback: true,
            name: '2-128-0-level',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:2:0:battery:level',
            feature_name: '',
            selector: 'zwavejs-ui:2:0:battery:level',
            node_id: 2,
            property_name: 'level',
            property_key_name: undefined,
            unit: 'percent',
          },
          {
            category: 'battery-low',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: true,
            has_feedback: true,
            name: '2-128-0-isLow',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:2:0:battery:islow',
            feature_name: '',
            selector: 'zwavejs-ui:2:0:battery:islow',
            node_id: 2,
            property_name: 'isLow',
            property_key_name: undefined,
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
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:5:0:central_scene:scene:001',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '5-91-0-scene-001',
            node_id: 5,
            property_key_name: '001',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:5:0:central_scene:scene:001',
            type: 'click',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:5:0:central_scene:scene:002',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '5-91-0-scene-002',
            node_id: 5,
            property_key_name: '002',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:5:0:central_scene:scene:002',
            type: 'click',
          },
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
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:restoreprevious',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-restorePrevious',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'restorePrevious',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:restoreprevious',
            type: 'binary',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:central_scene:scene:001',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '6-91-0-scene-001',
            node_id: 6,
            property_key_name: '001',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:6:0:central_scene:scene:001',
            type: 'click',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:central_scene:scene:002',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '6-91-0-scene-002',
            node_id: 6,
            property_key_name: '002',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:6:0:central_scene:scene:002',
            type: 'click',
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
      {
        external_id: 'zwavejs-ui:8',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:8:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '8-38-0-currentValue:position',
            node_id: 8,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:8:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:8:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '8-38-0-currentValue:state',
            node_id: 8,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:8:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:8:0:multilevel_switch:restoreprevious',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '8-38-0-restorePrevious',
            node_id: 8,
            property_key_name: undefined,
            property_name: 'restorePrevious',
            read_only: false,
            selector: 'zwavejs-ui:8:0:multilevel_switch:restoreprevious',
            type: 'binary',
          },
          {
            category: 'temperature-sensor',
            command_class: 49,
            command_class_name: 'Multilevel Sensor',
            command_class_version: 3,
            endpoint: 0,
            external_id: 'zwavejs-ui:8:0:multilevel_sensor:air_temperature',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 150,
            min: -100,
            name: '8-49-0-Air temperature',
            node_id: 8,
            property_key_name: undefined,
            property_name: 'Air temperature',
            read_only: true,
            selector: 'zwavejs-ui:8:0:multilevel_sensor:air_temperature',
            type: 'decimal',
            unit: 'celsius',
          },
        ],
        name: 'Radiateur',
        params: [
          {
            name: 'location',
            value: 'Bureau',
          },
        ],
        selector: 'zwavejs-ui:8',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
      },
      {
        external_id: 'zwavejs-ui:9',
        features: [
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 2,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:central_scene:scene:001',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '9-91-0-scene-001',
            node_id: 9,
            property_key_name: '001',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:9:0:central_scene:scene:001',
            type: 'click',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 2,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:central_scene:scene:002',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '9-91-0-scene-002',
            node_id: 9,
            property_key_name: '002',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:9:0:central_scene:scene:002',
            type: 'click',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 2,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:central_scene:scene:003',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '9-91-0-scene-003',
            node_id: 9,
            property_key_name: '003',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:9:0:central_scene:scene:003',
            type: 'click',
          },
          {
            category: 'button',
            command_class: 91,
            command_class_name: 'Central Scene',
            command_class_version: 2,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:central_scene:scene:004',
            feature_name: '',
            has_feedback: true,
            keep_history: false,
            max: 4,
            min: 0,
            name: '9-91-0-scene-004',
            node_id: 9,
            property_key_name: '004',
            property_name: 'scene',
            read_only: true,
            selector: 'zwavejs-ui:9:0:central_scene:scene:004',
            type: 'click',
          },
          {
            category: 'battery-low',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: true,
            has_feedback: true,
            name: '9-128-0-isLow',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:battery:islow',
            feature_name: '',
            selector: 'zwavejs-ui:9:0:battery:islow',
            node_id: 9,
            property_name: 'isLow',
            property_key_name: undefined,
          },
          {
            category: 'battery',
            type: 'integer',
            min: 0,
            max: 100,
            keep_history: true,
            read_only: true,
            has_feedback: true,
            name: '9-128-0-level',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:9:0:battery:level',
            feature_name: '',
            selector: 'zwavejs-ui:9:0:battery:level',
            node_id: 9,
            property_name: 'level',
            property_key_name: undefined,
            unit: 'percent',
          },
        ],
        name: 'SceneController',
        params: [
          {
            name: 'location',
            value: 'Loc1',
          },
        ],
        selector: 'zwavejs-ui:9',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
      },
      {
        external_id: 'zwavejs-ui:41',
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.GENERAL_SENSOR,
            command_class: 48,
            command_class_name: 'Binary Sensor',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:41:0:binary_sensor:any',
            feature_name: '',
            has_feedback: true,
            keep_history: true,
            max: 1,
            min: 0,
            name: '41-48-0-Any',
            node_id: 41,
            property_key_name: undefined,
            property_name: 'Any',
            read_only: true,
            selector: 'zwavejs-ui:41:0:binary_sensor:any',
            type: 'binary',
          },
          {
            category: 'temperature-sensor',
            command_class: 49,
            command_class_name: 'Multilevel Sensor',
            command_class_version: 5,
            endpoint: 0,
            external_id: 'zwavejs-ui:41:0:multilevel_sensor:air_temperature',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 150,
            min: -100,
            name: '41-49-0-Air temperature',
            node_id: 41,
            property_key_name: undefined,
            property_name: 'Air temperature',
            read_only: true,
            selector: 'zwavejs-ui:41:0:multilevel_sensor:air_temperature',
            type: 'decimal',
            unit: 'celsius',
          },
          {
            category: 'light-sensor',
            command_class: 49,
            command_class_name: 'Multilevel Sensor',
            command_class_version: 5,
            endpoint: 0,
            external_id: 'zwavejs-ui:41:0:multilevel_sensor:illuminance',
            feature_name: '',
            has_feedback: false,
            keep_history: true,
            max: 100000,
            min: 0,
            name: '41-49-0-Illuminance',
            node_id: 41,
            property_key_name: undefined,
            property_name: 'Illuminance',
            read_only: true,
            selector: 'zwavejs-ui:41:0:multilevel_sensor:illuminance',
            type: 'decimal',
            unit: 'lux',
          },
          {
            category: 'battery',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:41:0:battery:level',
            feature_name: '',
            has_feedback: true,
            keep_history: true,
            max: 100,
            min: 0,
            name: '41-128-0-level',
            node_id: 41,
            property_key_name: undefined,
            property_name: 'level',
            read_only: true,
            selector: 'zwavejs-ui:41:0:battery:level',
            type: 'integer',
            unit: 'percent',
          },
          {
            category: 'battery-low',
            command_class: 128,
            command_class_name: 'Battery',
            command_class_version: 1,
            endpoint: 0,
            external_id: 'zwavejs-ui:41:0:battery:islow',
            feature_name: '',
            has_feedback: true,
            keep_history: true,
            max: 1,
            min: 0,
            name: '41-128-0-isLow',
            node_id: 41,
            property_key_name: undefined,
            property_name: 'isLow',
            read_only: true,
            selector: 'zwavejs-ui:41:0:battery:islow',
            type: 'binary',
          },
        ],
        name: '41 - Fibargroup Motion Sensor FGMS001',
        params: [
          {
            name: 'location',
            value: 'Salon',
          },
        ],
        selector: 'zwavejs-ui:41',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: false,
      },
    ]);
  });
});
