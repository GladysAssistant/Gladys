---
inject: true
to: ../front/src/config/demo.js
before: "\'get /api/v1/job?take=500\': ["
skip_if: "get /api/v1/service/<%= module %>/device"
---
  'get /api/v1/service/<%= module %>': {
    id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
    name: '<%= module %>',
    selector: '<%= module %>'
  },
  'get /api/v1/service/<%= module %>/device': [
    {
      id: '28e8ad03-70a8-431f-93cb-df916019c509',
      room_id: '568981d0-1a4d-40ea-af97-dd4037d2b344',
      name: '<%= module %> device 1',
      selector: '<%= module %>-1000768322-0',
      model: 'MINI',
      external_id: '<%= module %>:1000768322:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          id: '6f8172ed-37e5-4785-94ad-ec33706a31f3',
          device_id: '28e8ad03-70a8-431f-93cb-df916019c509',
          name: 'Magical <%= module %> device 1',
          selector: '<%= module %>-1000768322-0-binary',
          external_id: '<%= module %>:1000768322:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: [
      ],
      room: {
        id: 'cecc52c7-3e67-4b75-9b13-9a8867b0443d',
        name: 'Living Room',
        selector: 'living-room'
      },
      service: {
        id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
        name: '<%= module %>',
        selector: '<%= module %>'
      }
    }
  ],
  'get /api/v1/service/<%= module %>/discover': [
    {
      service_id: '45c792a5-051b-4e6f-b746-2dd4c77d9d31',
      name: '<%= module %> device 2',
      model: 'Basic',
      external_id: '<%= module %>:10004636bf:0',
      selector: '<%= module %>:10004636bf:0',
      should_poll: true,
      poll_frequency: 60000,
      features: [
        {
          name: 'Magical <%= module %> device 2',
          external_id: '<%= module %>:10004636bf:0:binary',
          selector: '<%= module %>:10004636bf:0:binary',
          category: 'switch',
          type: 'binary',
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 1
        }
      ],
      params: []
    }
  ],
  'get /api/v1/service/<%= module %>/scan': [
    {
      id: '3',
      name: 'Magical Plug-in',
      model: 'Atari ST',
      external_id: '<%= module %>-3',
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
      name: 'Fantasmagorical device',
      model: 'BB8',
      external_id: '<%= module %>-4',
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