import { CAMERA_IMAGE } from './assets';
import { minutesAgo } from './helpers';

// Demo fixtures for the integration pages: every "/api/v1/service/*" route
// and the devices those pages display.
const integrations = {
  'get /api/v1/service/philips-hue/bridge': [
    {
      name: 'Philips hue',
      ipaddress: '192.168.2.245'
    }
  ],
  'get /api/v1/service/zwave/status': {
    connected: true,
    scanInProgress: false,
    ready: true
  },
  'get /api/v1/service/zwave/node': [
    {
      name: 'ZME_UZB1 USB Stick',
      features: [],
      params: [],
      ready: true,
      rawZwaveNode: {
        id: 1,
        manufacturer: 'Z-Wave.Me',
        manufacturerid: '0x0115',
        product: 'ZME_UZB1 USB Stick',
        producttype: '0x0400',
        productid: '0x0001',
        type: 'Static PC Controller',
        classes: []
      }
    }
  ],
  'get /api/v1/service/zwave/neighbor': [
    {
      id: '1',
      manufacturer: 'Z-Wave.Me',
      product: 'ZME_UZB1 USB Stick',
      neighbors: [2, 3, 4, 5, 6, 7, 8, 10]
    },
    {
      id: '2',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '3',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '4',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '5',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '6',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '7',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '8',
      manufacturer: '',
      product: '',
      neighbors: []
    },
    {
      id: '10',
      manufacturer: 'FIBARO System',
      product: 'FGMS001-ZW5 Motion Sensor',
      neighbors: [1]
    }
  ],
  'get /api/v1/service/usb/port': [
    {
      comPath: '/dev/ttyUSB0',
      comVID: '0658',
      comName: '0200'
    },
    {
      comPath: '/dev/ttyUSB1',
      comVID: '0478',
      comName: '0910'
    }
  ],
  'get /api/v1/service/zwave/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Fibaro Motion Sensor',
      selector: 'zwave:1234',
      external_id: 'test-sensor-external',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Temperature',
          selector: 'test-temperature',
          category: 'temperature-sensor',
          type: 'decimal'
        },
        {
          name: 'Motion',
          selector: 'test-motion',
          category: 'motion-sensor',
          type: 'binary'
        },
        {
          name: 'Battery',
          selector: 'test-battery',
          category: 'battery',
          type: 'integer',
          last_value: '92'
        },
        {
          name: 'Lux',
          selector: 'test-light',
          category: 'light-sensor',
          type: 'integer'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    }
  ],
  'get /api/v1/service/broadlink': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279'
  },
  'get /api/v1/service/broadlink/peripheral': [
    {
      address: '210.248.100.245',
      mac: '4bf75cf0fdbb',
      name: 'MP1',
      device: {
        name: 'MP1',
        external_id: 'broadlink:1cee8bf16731',
        selector: 'broadlink:1cee8bf16731',
        model: 'MP1',
        service_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        created_at: '2019-02-12T07:49:07.556Z',
        should_poll: true,
        poll_frequency: 60000,
        features: [
          {
            name: 'MP1 1',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:0',
            selector: 'broadlink:0',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 2',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:1',
            selector: 'broadlink:1',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 3',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:2',
            selector: 'broadlink:2',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          },
          {
            name: 'MP1 4',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:3',
            selector: 'broadlink:3',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          }
        ]
      }
    },
    {
      address: '227.154.146.114',
      name: 'SP2',
      mac: '7396e6541fb0',
      canLearn: false,
      device: {
        external_id: 'broadlink:7396e6541fb0',
        selector: 'broadlink:7396e6541fb0',
        model: 'SP2',
        name: 'SP2',
        service_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        should_poll: true,
        poll_frequency: 60000,
        features: [
          {
            name: 'SP2',
            category: 'switch',
            type: 'binary',
            external_id: 'broadlink:0',
            selector: 'broadlink:0',
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true
          }
        ]
      }
    },
    {
      address: '220.156.58.18',
      name: 'RM3 Pro Plus',
      mac: '1cee8bf16731',
      canLearn: true
    }
  ],
  'get /api/v1/service/broadlink/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'TV Remote',
      selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0',
      external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0',
      should_poll: false,
      poll_frequency: null,
      model: 'television',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    },
    {
      id: '197018ef-5110-4e3d-9022-cecb85fce5cb',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'LED remote',
      selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb',
      external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb',
      should_poll: false,
      poll_frequency: null,
      model: 'light',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    },
    {
      id: '1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'SP2',
      selector: 'broadlink-1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      external_id: 'broadlink:1e5412c3-a6b7-4c5f-aede-20c40adbd85d',
      should_poll: false,
      poll_frequency: null,
      model: 'sp2',
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      features: [
        {
          name: 'sp2',
          category: 'switch',
          type: 'binary',
          external_id: 'broadlink:0',
          selector: 'broadlink-0',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true
        }
      ]
    }
  ],
  'get /api/v1/device/broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb': {
    id: '197018ef-5110-4e3d-9022-cecb85fce5cb',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'LED remote',
    model: 'light',
    selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb',
    external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        id: 'db05402f-8795-4942-903e-351716ee04f9',
        name: 'Power ON',
        external_id: 'broadlink:197018ef-5110-4e3d-9022-cecb85fce5cb:binary',
        selector: 'broadlink-197018ef-5110-4e3d-9022-cecb85fce5cb-binary',
        category: 'light',
        type: 'binary'
      }
    ],
    params: [
      {
        name: 'peripheral',
        value: '1cee8bf16731'
      },
      {
        name: 'code_binary-0',
        value: 'POWER_OFF'
      },
      {
        name: 'code_binary-1',
        value: 'POWER_ON'
      }
    ]
  },
  'get /api/v1/device/broadlink-fbedb47f-4d25-4381-8923-2633b23192a0': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'TV Remote',
    model: 'television',
    selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0',
    external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        id: '22d37c48-6805-4118-ba1c-fa44052c2d3c',
        name: 'Power',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:binary',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-binary',
        category: 'television',
        type: 'binary'
      },
      {
        id: '1667855b-a58d-4a8c-9ac6-c40c2a544db8',
        name: 'Source',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:source',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-source',
        category: 'television',
        type: 'source'
      },
      {
        id: '8d8a9fb1-dbd0-4f31-bbc7-8ffebf1e9f93',
        name: 'Channel',
        external_id: 'broadlink:fbedb47f-4d25-4381-8923-2633b23192a0:channel',
        selector: 'broadlink-fbedb47f-4d25-4381-8923-2633b23192a0-channel',
        category: 'television',
        type: 'channel'
      }
    ],
    params: [
      {
        name: 'code_binary-1',
        value: 'POWER'
      },
      {
        name: 'code_source',
        value: 'SOURCE'
      },
      {
        name: 'code_channel-0',
        value: 'CHANNEL_0'
      },
      {
        name: 'code_channel-1',
        value: 'CHANNEL_1'
      },
      {
        name: 'code_channel-2',
        value: 'CHANNEL_2'
      },
      {
        name: 'code_channel-3',
        value: 'CHANNEL_3'
      },
      {
        name: 'code_channel-4',
        value: 'CHANNEL_4'
      },
      {
        name: 'code_channel-5',
        value: 'CHANNEL_5'
      },
      {
        name: 'code_channel-6',
        value: 'CHANNEL_6'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'post /api/v1/service/broadlink/learn': {},
  'post /api/v1/service/broadlink/learn/cancel': {},
  // The installed community integration is derived from the house (see
  // index.js); the store itself is empty, the demo cannot install anything
  'get /api/v1/external_integration/store': { integrations: [] },
  'get /api/v1/service/mqtt': {},
  'get /api/v1/service/mqtt/status': {
    configured: true,
    connected: true
  },
  'get /api/v1/service/mqtt/config': {
    useEmbeddedBroker: true,
    dockerBased: true,
    networkModeValid: true,
    brokerContainerAvailable: false
  },
  'get /api/v1/service/mqtt/discovery': [
    {
      name: 'Temperature sensor',
      external_id: 'homeassistant:demo-temperature-sensor',
      selector: 'homeassistant:demo-temperature-sensor',
      model: 'Sensor 2000',
      service_id: '2e0bc58b-11e2-4176-8ad3-9ebc8cdd2318',
      should_poll: false,
      features: [
        {
          name: 'Temperature',
          external_id: 'homeassistant:demo-temperature-sensor:sensor:temperature',
          selector: 'homeassistant:demo-temperature-sensor:sensor:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          has_feedback: true,
          keep_history: true,
          min: -100000,
          max: 100000
        }
      ],
      params: []
    }
  ],
  'get /api/v1/service/zigbee2mqtt': {},
  'get /api/v1/service/zigbee2mqtt/permit_join': true,
  'get /api/v1/service/zigbee2mqtt/discovered': [
    {
      name: 'Aqara Sensor',
      external_id: 'zigbee2mqtt:0x00158d0005828ece',
      selector: 'zigbee2mqtt-0x00158d0005828ece',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      model: 'WSDCGQ11LM',
      updatable: true,
      created_at: '2019-02-12T07:49:07.556Z',
      params: [
        {
          name: 'model',
          value: 'WSDCGQ11LM'
        }
      ],
      features: [
        {
          category: 'pressure-sensor',
          external_id: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          name: 'Pressure Sensor',
          read_only: true,
          selector: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal:pressure',
          type: 'decimal'
        }
      ]
    },
    {
      model: 'WXKG01LM',
      name: '0x00158d00033e88d5',
      service_id: 'f87b7af2-ca8e-44fc-b754-444354b42fee',
      should_poll: false,
      external_id: 'zigbee2mqtt:0x00158d00033e88d5',
      features: [
        {
          category: 'battery',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:battery:integer:battery',
          has_feedback: false,
          max: 100,
          min: 0,
          name: 'Battery',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-battery-integer-battery',
          type: 'integer',
          unit: 'percent'
        },
        {
          category: 'button',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:button:click:action',
          has_feedback: false,
          max: 7,
          min: 0,
          name: 'Action',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-button-click-action',
          type: 'click',
          unit: null
        },
        {
          category: 'switch',
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:switch:voltage:voltage',
          has_feedback: false,
          max: 10000,
          min: 0,
          name: 'Voltage',
          read_only: true,
          selector: 'zigbee2mqtt-0x00158d00033e88d5-switch-voltage-voltage',
          type: 'voltage',
          unit: 'millivolt'
        }
      ]
    },
    {
      name: 'Unsupported device',
      external_id: 'zigbee2mqtt:0x00158d0005828ece',
      selector: 'zigbee2mqtt-0x00158d0005828ece',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      features: [
        {
          category: 'battery',
          name: 'Pressure Sensor',
          read_only: true,
          type: 'decimal'
        }
      ]
    }
  ],
  'get /api/v1/service/zigbee2mqtt/setup': {
    ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB0',
    ZIGBEE_DONGLE_NAME: 'Electrolama zig-a-zig-ah! (zzh!)',
    Z2M_TCP_PORT: '59801'
  },
  'post /api/v1/service/zigbee2mqtt/setup': {
    ZIGBEE2MQTT_DRIVER_PATH: '/dev/ttyUSB1',
    ZIGBEE_DONGLE_NAME: 'RaspBee',
    Z2M_TCP_PORT: '12000'
  },
  'get /api/v1/service/zigbee2mqtt/adapter': [
    { label: 'ConBee', configKey: 'deconz' },
    { label: 'ConBee II', configKey: 'deconz' },
    { label: 'RaspBee', configKey: 'deconz' },
    { label: 'RaspBee II', configKey: 'deconz' },
    { label: 'Home Assistant Connect ZBT-2', configKey: 'ember' },
    { label: 'Home Assistant SkyConnect (by Nabu Casa)', configKey: 'ember' },
    { label: 'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"', configKey: 'ember' },
    { label: 'SONOFF Dongle-M', configKey: 'ember' },
    { label: 'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator', configKey: 'ember' },
    { label: 'SONOFF Zigbee 3.0 USB Dongle Plus ZBDongle-P', configKey: 'zstack' },
    { label: "Slaesh's CC2652RB stick", configKey: 'zstack' },
    { label: 'SMLIGHT CC2652P Zigbee USB Adapter SLZB-02', configKey: 'zstack' },
    { label: 'SMLIGHT SLZB-06 Zigbee ethernet USB POE WiFi LAN adapter', configKey: 'zstack' },
    { label: 'SMLIGHT SLZB-07p7 Zigbee USB CC2652P7 adapter', configKey: 'zstack' },
    { label: 'SMLIGHT Zigbee LAN Adapter CC2652P Model SLZB-05', configKey: 'zstack' },
    { label: 'Vision CC2538+CC2592 Dongle(VS203)', configKey: 'zstack' },
    { label: 'Vision CC2652 dongle', configKey: 'zstack' },
    { label: 'XGG Gateway', configKey: 'zstack' },
    { label: 'XGG 52PZ2MGateway', configKey: 'zstack' },
    { label: 'ZigStar LAN Coordinator', configKey: 'zstack' },
    { label: 'ZigStar PoE Coordinator', configKey: 'zstack' },
    { label: 'ZigStar Stick v4', configKey: 'zstack' },
    { label: 'ZigStar UZG-01 - Universal Zigbee Gateway', configKey: 'zstack' },
    { label: 'ZigStar ZigiHAT PoE', configKey: 'zstack' }
  ],
  'get /api/v1/service/zigbee2mqtt/status': {
    usbConfigured: true,
    mqttExist: true,
    mqttRunning: true,
    zigbee2mqttExist: true,
    zigbee2mqttRunning: true,
    gladysConnected: true,
    zigbee2mqttConnected: true,
    z2mEnabled: true,
    dockerBased: true,
    networkModeValid: true,
    coordinatorFirmware: {
      majorrel: 7,
      minorrel: 0,
      maintrel: 1,
      revision: 74100,
      type: 'EmberZNet'
    }
  },
  'get /api/v1/service/nuki': {},
  'get /api/v1/service/nuki/config': {},
  'get /api/v1/service/nuki/status': {
    mqttOk: true,
    webOk: true
  },
  'get /api/v1/service/nuki/device': [
    {
      external_id: 'nuki:398172f4',
      model: 'Smart Lock 3.0 Pro',
      name: 'Smart Lock 3.0 Pro',
      selector: 'nuki-398172f4',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      features: [
        {
          category: 'battery',
          type: 'integer'
        },
        {
          category: 'lock',
          type: 'binary'
        },
        {
          category: 'lock',
          type: 'state'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'mqtt'
        }
      ]
    }
  ],
  'get /api/v1/service/nuki/discover/mqtt': [
    {
      name: 'Smart Lock 2.0 Pro Plus',
      external_id: 'nuki:398172f6',
      created_at: '2025-02-12T07:49:07.556Z',
      features: [
        {
          category: 'battery',
          type: 'integer'
        },
        {
          category: 'lock',
          type: 'binary'
        },
        {
          category: 'lock',
          type: 'state'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'mqtt'
        }
      ]
    }
  ],
  'get /api/v1/service/nuki/discover/http': [
    {
      name: 'Smart Lock 2.0 Pro Plus Moins',
      external_id: 'nuki:398172f6',
      created_at: '2025-02-12T07:49:07.556Z',
      features: [
        {
          category: 'battery',
          type: 'integer'
        },
        {
          category: 'lock',
          type: 'binary'
        },
        {
          category: 'lock',
          type: 'state'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    }
  ],
  'get /api/v1/service/tasmota': {},
  'get /api/v1/device/tasmota-sonoff-basic': {
    name: 'Switch',
    external_id: 'tasmota:sonoff-basic',
    selector: 'sonoff-basic',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'sonoff-basic',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/device/zigbee2mqtt-0x00158d0005828ece': {
    name: 'Aqara Sensor',
    external_id: 'zigbee2mqtt-0x00158d0005828ece',
    selector: 'zigbee2mqtt-0x00158d0005828ece',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'zigbee2mqtt-0x00158d0005828ece',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/device/tasmota-192-168-1-1': {
    name: 'Switch',
    external_id: 'tasmota:sonoff-basic',
    selector: 'sonoff-basic',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    model: 'sonoff-basic',
    features: [
      {
        category: 'switch',
        type: 'binary',
        name: 'Switch'
      }
    ]
  },
  'get /api/v1/service/tasmota/discover/mqtt': [
    {
      name: 'Sonoff Basic Kitchen',
      external_id: 'tasmota:sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      model: 'sonoff-basic',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    },
    {
      name: 'Sonoff Pow Kitchen',
      external_id: 'tasmota:sonoff-pow',
      model: 'sonoff-pow',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    },
    {
      name: 'Sonoff Mini Outside',
      external_id: 'tasmota:sonoff-mini',
      model: 'sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      updatable: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ]
    }
  ],
  'get /api/v1/service/tasmota/discover/http': [
    {
      name: 'Sonoff Basic Kitchen',
      external_id: 'tasmota:192.168.1.1',
      created_at: '2019-02-12T07:49:07.556Z',
      model: 'sonoff-basic',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: 'Sonoff Pow Kitchen',
      external_id: 'tasmota:192.168.1.2',
      model: 'sonoff-pow',
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: 'Sonoff Mini Outside',
      external_id: 'tasmota:192.168.1.3',
      model: 'sonoff-basic',
      created_at: '2019-02-12T07:49:07.556Z',
      updatable: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    },
    {
      name: '192.168.1.3',
      external_id: 'tasmota:192.168.1.3',
      created_at: '2019-02-12T07:49:07.556Z',
      needAuthentication: true,
      features: [
        {
          category: 'switch',
          type: 'binary'
        }
      ],
      params: [
        {
          name: 'protocol',
          value: 'http'
        }
      ]
    }
  ],
  'get /api/v1/service/rtsp-camera': {
    id: 'aa7d6284-6b80-4e78-9e08-a4122207edcd'
  },
  'post /api/v1/service/rtsp-camera/camera/test': CAMERA_IMAGE,
  'get /api/v1/service/lan-manager/device': [
    {
      id: '6dbd067a-efdd-428e-8c1b-cb792255eae2',
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Media server',
      selector: 'lan-00B0D063C226',
      external_id: 'lan-00B0D063C226',
      should_poll: false,
      poll_frequency: null,
      created_at: '2023-01-05T08:28:09.567Z',
      updated_at: '2023-01-05T08:28:09.567Z',
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: minutesAgo(6)
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      params: [
        {
          name: 'DEVICE_MAC',
          value: '00:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'media.lan'
        },
        {
          name: 'MANUFACTURER',
          value: 'Bob and co.'
        }
      ]
    }
  ],
  'get /api/v1/service/lan-manager/status': {
    scanning: false
  },
  'get /api/v1/service/lan-manager/config': {
    presenceScanner: {
      frequency: 120000,
      status: 'enabled'
    },
    ipMasks: [
      {
        mask: '192.168.1.1/24',
        name: 'eth0',
        networkInterface: true,
        enabled: false
      },
      {
        mask: '192.168.0.1/10',
        name: 'Custom',
        enabled: true
      }
    ]
  },
  'get /api/v1/service/lan-manager/discover': [
    {
      id: '6dbd067a-efdd-428e-8c1b-cb792255eae2',
      ip: '192.168.1.22',
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Media server',
      selector: 'lan-00B0D063C226',
      external_id: 'lan-00B0D063C226',
      should_poll: false,
      poll_frequency: null,
      created_at: '2023-01-05T08:28:09.567Z',
      updated_at: '2023-01-05T08:28:09.567Z',
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: minutesAgo(6)
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: '00:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'media.lan'
        },
        {
          name: 'MANUFACTURER',
          value: 'Bob and co.'
        }
      ]
    },
    {
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      name: 'New device',
      ip: '192.168.1.10',
      can_save: true,
      selector: 'lan-12B0D063C226',
      external_id: 'lan-12B0D063C226',
      should_poll: false,
      poll_frequency: null,
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: minutesAgo(6)
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: '12:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'device.lan'
        }
      ]
    },
    {
      service_id: 'd1af258c-2016-4dc9-b0cc-d2e92dd2fcec',
      name: 'Random MAC device',
      ip: '192.168.1.100',
      can_save: false,
      selector: 'lan-A2B0D063C226',
      external_id: 'lan-A2B0D063C226',
      should_poll: false,
      poll_frequency: null,
      features: [
        {
          name: 'Presence',
          selector: 'lan-presence-sensor',
          category: 'presence-sensor',
          type: 'push',
          unit: null,
          min: 0,
          max: 1,
          read_only: true,
          last_value: 0,
          last_value_changed: minutesAgo(6)
        }
      ],
      params: [
        {
          name: 'DEVICE_MAC',
          value: 'A2:B0:D0:63:C2:26'
        },
        {
          name: 'DEVICE_NAME',
          value: 'random.lan'
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi/sensor': [
    {
      name: 'Xiaomi Temperature',
      external_id: 'xiaomi:1234',
      selector: 'xiaomi:1234',
      features: [
        {
          name: 'Temperature',
          selector: 'xiaomi:12344:temperature',
          external_id: 'xiaomi:12344:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -20,
          max: 60
        },
        {
          name: 'Humidity',
          selector: 'xiaomi:12344:humidity',
          external_id: 'xiaomi:12344:humidity',
          category: 'humidity-sensor',
          type: 'decimal',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Battery',
          selector: 'xiaomi:12344:battery',
          external_id: 'xiaomi:12344:battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi/device': [
    {
      id: 'e5317b24-28e1-4839-9879-0bb7a3102e98',
      name: 'Xiaomi Temperature',
      external_id: 'xiaomi:1234',
      selector: 'xiaomi:1234',
      room_id: 'f99ab22a-e6a8-4756-b1fe-4d19dc8c8620',
      service_id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
      features: [
        {
          name: 'Temperature',
          selector: 'xiaomi:12344:temperature',
          external_id: 'xiaomi:12344:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -20,
          max: 60
        },
        {
          name: 'Humidity',
          selector: 'xiaomi:12344:humidity',
          external_id: 'xiaomi:12344:humidity',
          category: 'humidity-sensor',
          type: 'decimal',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Battery',
          selector: 'xiaomi:12344:battery',
          external_id: 'xiaomi:12344:battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        }
      ]
    }
  ],
  'get /api/v1/service/xiaomi': {
    id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
    name: 'Xiaomi',
    selector: 'xiaomi'
  },
  'get /api/v1/device/zwave:1234': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'Fibaro Motion Sensor',
    selector: 'zwave:1234',
    external_id: 'test-sensor-external',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        name: 'Temperature',
        external_id: 'zwave:1234:temperature',
        selector: 'test-temperature',
        category: 'temperature-sensor',
        unit: 'celsius',
        type: 'decimal'
      },
      {
        name: 'Motion',
        selector: 'test-motion',
        external_id: 'zwave:1234:temperature',
        category: 'motion-sensor',
        type: 'binary'
      },
      {
        name: 'Battery',
        selector: 'test-battery',
        external_id: 'zwave:1234:temperature',
        category: 'battery',
        type: 'integer',
        last_value: '92'
      },
      {
        name: 'Lux',
        selector: 'test-light',
        external_id: 'zwave:1234:temperature',
        category: 'light-sensor',
        type: 'integer'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'get /api/v1/service/zwave': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: 'Zwave',
    selector: 'zwave'
  },
  'get /api/v1/device/xiaomi:1234': {
    id: 'e5317b24-28e1-4839-9879-0bb7a3102e98',
    name: 'Xiaomi Temperature',
    external_id: 'xiaomi:1234',
    selector: 'xiaomi:1234',
    room_id: 'f99ab22a-e6a8-4756-b1fe-4d19dc8c8620',
    service_id: '70cb1e17-3b17-4886-83ab-45b00a9e03b1',
    features: [
      {
        name: 'Temperature',
        selector: 'xiaomi:12344:temperature',
        external_id: 'xiaomi:12344:temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60
      },
      {
        name: 'Humidity',
        selector: 'xiaomi:12344:humidity',
        external_id: 'xiaomi:12344:humidity',
        category: 'humidity-sensor',
        type: 'decimal',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      },
      {
        name: 'Battery',
        selector: 'xiaomi:12344:battery',
        external_id: 'xiaomi:12344:battery',
        category: 'battery',
        type: 'integer',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      }
    ]
  },
  'get /api/v1/service/philips-hue': {
    id: '1147bdef-0c95-40f1-a7ef-922ebcad7d0e',
    name: 'Philips Hue',
    selector: 'philips-hue'
  },
  'get /api/v1/service/philips-hue/light': [
    {
      id: '1',
      name: 'New Lamp',
      model: 'LCT007',
      external_id: 'philips-hue:4'
    },
    {
      id: '2',
      name: 'Living room lamp',
      model: 'LCT007',
      external_id: 'philips-hue:5'
    }
  ],
  'get /api/v1/service/bluetooth': {
    id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    name: 'bluetooth',
    enabled: true
  },
  'get /api/v1/service/bluetooth/config': {
    presenceScanner: {
      status: 'enabled',
      frequency: 60000
    }
  },
  'get /api/v1/service/bluetooth/device': [
    {
      id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Nut Smart Tracker',
      selector: 'bluetooth-sensor',
      external_id: 'test-sensor-external',
      should_poll: false,
      poll_frequency: null,
      created_at: '2019-02-12T07:49:07.556Z',
      updated_at: '2019-02-12T07:49:07.556Z',
      features: [
        {
          name: 'Battery',
          selector: 'test-battery',
          category: 'battery',
          type: 'integer',
          last_value: '12'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      }
    }
  ],
  'get /api/v1/device/bluetooth-sensor': {
    id: 'fbedb47f-4d25-4381-8923-2633b23192a0',
    service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    room_id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
    name: 'Nut Smart Tracker',
    selector: 'bluetooth-sensor',
    external_id: 'bluetooth:external',
    should_poll: false,
    poll_frequency: null,
    created_at: '2019-02-12T07:49:07.556Z',
    updated_at: '2019-02-12T07:49:07.556Z',
    features: [
      {
        name: 'Battery',
        selector: 'test-battery',
        category: 'battery',
        type: 'integer',
        last_value: '12'
      }
    ],
    room: {
      id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
      name: 'Living Room',
      selector: 'living-room'
    }
  },
  'get /api/v1/service/bluetooth/status': {
    ready: true
  },
  'get /api/v1/service/bluetooth/peripheral': [
    {
      name: 'BLE Device 1',
      external_id: 'bluetooth:0011223341',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      service: {
        name: 'bluetooth'
      },
      selector: 'bluetooth-0011223341',
      features: [],
      params: [
        {
          name: 'loaded',
          value: false
        }
      ]
    },
    {
      name: 'SML c9',
      model: 'smlc9',
      external_id: 'bluetooth:0011223342',
      service: {
        name: 'bluetooth'
      },
      selector: 'bluetooth-0011223342',
      features: [],
      params: [
        {
          name: 'loaded',
          value: true
        },
        {
          name: 'manufacturer',
          value: 'AwoX'
        }
      ]
    },
    {
      name: 'Peanut temperature',
      external_id: 'bluetooth:0011223343',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996278',
      service: {
        name: 'peanut'
      },
      selector: 'bluetooth-0011223343',
      params: [
        {
          name: 'loaded',
          value: true
        },
        {
          name: 'manufacturer',
          value: 'Peanut'
        }
      ],
      features: [
        {
          name: 'Battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100
        },
        {
          name: 'Temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: -100,
          max: 250
        }
      ]
    }
  ],
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223341': {
    name: 'BLE Device 1',
    external_id: 'bluetooth:0011223341',
    selector: 'bluetooth-0011223341',
    features: [],
    params: [
      {
        name: 'loaded',
        value: false
      }
    ]
  },
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223342': {
    name: 'SML c9',
    model: 'smlc9',
    external_id: 'bluetooth:0011223342',
    selector: 'bluetooth-0011223342',
    features: [],
    params: [
      {
        name: 'loaded',
        value: true
      },
      {
        name: 'manufacturer',
        value: 'AwoX'
      }
    ]
  },
  'get /api/v1/service/bluetooth/peripheral/bluetooth-0011223343': {
    name: 'Peanut temperature',
    external_id: 'bluetooth:0011223343',
    selector: 'bluetooth-0011223343',
    params: [
      {
        name: 'loaded',
        value: true
      },
      {
        name: 'manufacturer',
        value: 'Peanut'
      }
    ],
    features: [
      {
        name: 'Battery',
        category: 'battery',
        type: 'integer',
        unit: 'percent',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100
      },
      {
        name: 'Temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -100,
        max: 250
      }
    ]
  },
  'get /api/v1/service/ewelink': {
    id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
    name: 'ewelink',
    selector: 'ewelink'
  },
  'get /api/v1/service/ewelink/device': [
    {
      id: '28e8ad03-70a8-431f-93cb-df916019c509',
      room_id: '568981d0-1a4d-40ea-af97-dd4037d2b344',
      name: 'Switch 1',
      selector: 'ewelink-1000768322-0',
      model: 'MINI',
      external_id: 'ewelink:1000768322:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          id: '6f8172ed-37e5-4785-94ad-ec33706a31f3',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'Switch 1 On/Off',
          selector: 'ewelink-1000768322-0-binary',
          external_id: 'ewelink:1000768322:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: [
        {
          id: '5e1ef948-305b-44c5-bb78-78952b1f5cb2',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'IP_ADDRESS',
          value: '0.0.0.1'
        },
        {
          id: 'f3a6f3fa-a7b0-4968-b9fd-2e492ced2274',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'FIRMWARE',
          value: '3.3.0'
        },
        {
          name: 'ONLINE',
          value: '1'
        }
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      service: {
        id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
        name: 'ewelink',
        selector: 'ewelink'
      }
    }
  ],
  'get /api/v1/service/ewelink/discover': [
    {
      service_id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
      name: 'Switch 2',
      model: 'Basic',
      external_id: 'ewelink:10004636bf:0',
      selector: 'ewelink:10004636bf:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          name: 'Switch 2 On/Off',
          external_id: 'ewelink:10004636bf:0:binary',
          selector: 'ewelink:10004636bf:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: [
        {
          name: 'IP_ADDRESS',
          value: '0.0.0.2'
        },
        {
          name: 'FIRMWARE',
          value: '3.2.1'
        },
        {
          name: 'ONLINE',
          value: '1'
        }
      ]
    }
  ],
  'get /api/v1/service/tp-link': {
    id: 'c9fe2705-35dc-417b-b6fc-c4bbb9c69886',
    pod_id: null,
    name: 'tp-link',
    selector: 'tp-link',
    version: '0.1.0',
    has_message_feature: false,
    status: 'RUNNING',
    created_at: '2020-11-11T18:41:40.052Z',
    updated_at: '2020-11-28T07:44:07.731Z'
  },
  'get /api/v1/service/tp-link/device': [
    {
      id: '1',
      name: 'Plug Coffee Machine',
      model: 'HS100',
      external_id: 'tp-link-1',
      features: [
        {
          name: 'On/Off',
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '2',
      name: 'Light Swimming Pool',
      model: 'LB100',
      external_id: 'tp-link-2',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/tp-link/scan': [
    {
      id: '3',
      name: 'Plug TV Dock',
      model: 'HS100',
      external_id: 'tp-link-3',
      features: [
        {
          name: 'On/Off',
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    },
    {
      id: '4',
      name: 'Light Bedroom',
      model: 'LB100',
      external_id: 'tp-link-4',
      features: [
        {
          name: 'On/Off',
          category: 'light',
          type: 'binary',
          min: 0,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/sonos/discover': [
    {
      name: 'Sonos Speaker',
      external_id: 'sonos:uuid',
      features: [
        {
          name: 'Sonos Play',
          category: 'music',
          type: 'play',
          min: 1,
          max: 1
        }
      ]
    },
    {
      name: 'Sonos Speaker',
      external_id: 'sonos:another_uuid',
      features: [
        {
          name: 'Sonos Play',
          category: 'music',
          type: 'play',
          min: 1,
          max: 1
        }
      ]
    }
  ],
  'get /api/v1/service/edf-tempo/state': {
    today_peak_state: 'blue',
    tomorrow_peak_state: 'blue',
    current_hour_peak_state: 'peak-hour'
  },

  // --- Integrations that are not installed in the demo house --------------
  // Their pages must still open without an error: the demo answers what an
  // instance where the integration was never configured returns.
  'get /api/v1/service/tuya': {},
  'get /api/v1/service/tuya/status': {
    status: 'not_configured',
    configured: false,
    connected: false,
    manual_disconnect: false
  },
  'get /api/v1/service/tuya/device': [],
  'get /api/v1/service/tuya/discover': [],
  'get /api/v1/service/melcloud': {},
  'get /api/v1/service/melcloud/discover': [],
  'get /api/v1/service/netatmo/status': {
    status: 'not_initialized',
    connected: false,
    configured: false
  },
  'get /api/v1/service/netatmo/configuration': {
    clientId: '',
    clientSecret: '',
    energyApi: true,
    weatherApi: true
  },
  'get /api/v1/service/netatmo/discover': [],
  'get /api/v1/service/node-red/status': {
    nodeRedExist: false,
    nodeRedRunning: false,
    nodeRedEnabled: false,
    dockerBased: true,
    networkModeValid: true
  },
  'get /api/v1/service/node-red/configuration': {
    dockerNodeRedVersion: '4',
    availableMajorVersions: ['3', '4']
  },
  'get /api/v1/service/zwavejs-ui/status': {
    configured: false,
    connected: false
  },
  'get /api/v1/service/zwavejs-ui/configuration': {
    mqtt_url: '',
    mqtt_username: '',
    mqtt_password: ''
  },
  'get /api/v1/service/zwavejs-ui/node': [],
  'get /api/v1/service/zwavejs-ui/device': [],
  'get /api/v1/service/airplay/device': [],
  'get /api/v1/service/airplay/discover': [],
  'get /api/v1/service/google-cast/discover': [],
  'get /api/v1/service/matter/ipv6': {
    has_ipv6: true,
    ipv6_interfaces: [{ name: 'eth0', address: 'fe80::1c2b:3d4e:5f60:7a8b' }]
  },
  // The Matter controller of the house: the garage door is already paired, so
  // nothing is left to discover
  'get /api/v1/service/matter/node': [],
  'get /api/v1/service/matter/paired-device': [],
  'get /api/v1/service/homekit/device': [],
  'get /api/v1/service/matterbridge/status': {
    matterbridgeExist: false,
    matterbridgeRunning: false,
    matterbridgeEnabled: false,
    dockerBased: true,
    networkModeValid: true
  },
  'get /api/v1/service/telegram/link': { link: 'https://t.me/GladysAssistantBot?start=demo' },
  // Contracts are downloaded from a GitHub release on a real instance: two
  // French contracts are enough to show what the import page does
  'get /api/v1/service/energy-monitoring/contracts': {
    'edf-base': {
      6: [{ start_date: '2024-02-01', price: 0.2516 }],
      9: [{ start_date: '2024-02-01', price: 0.2516 }]
    },
    'edf-peak-off-peak': {
      6: [{ start_date: '2024-02-01', peak_price: 0.27, off_peak_price: 0.2068 }],
      9: [{ start_date: '2024-02-01', peak_price: 0.27, off_peak_price: 0.2068 }]
    }
  },
  'get /api/v1/energy_price': [],
  'post /api/v1/energy_price': { success: true },
  // Gladys Plus AI quota, one bucket for text and one for images
  'get /api/v1/gateway/aichat/quota': {
    text: { remaining: 940, max: 1000, reset_in_seconds: 3600 * 9 },
    image: { remaining: 18, max: 20, reset_in_seconds: 3600 * 9 }
  }
};

export default integrations;
