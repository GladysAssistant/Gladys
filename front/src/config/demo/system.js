import dayjs from 'dayjs';

import { version as GLADYS_VERSION } from '../../../../package.json';
import { uuid, daysAgo, minutesAgo } from './helpers';

// Demo fixtures for the system, gateway, sessions and background jobs pages.
const system = {
  'get /api/v1/gateway/status': {
    configured: true,
    connected: true
  },
  'get /api/v1/gateway/backup/restore/status': {
    restore_in_progress: false,
    restore_errored: false
  },
  'get /api/v1/gateway/aichat/models': {
    models: [
      { id: 'gpt-oss-120b', priceLabel: '€0.15 / M tokens' },
      { id: 'mistral-small-3.2-24b-instruct-2506', priceLabel: '€0.15 / M tokens' },
      { id: 'qwen3-235b-a22b-instruct-2507', priceLabel: '€0.75 / M tokens' }
    ]
  },
  'get /api/v1/gateway/backup': [1, 2, 3].map(daysOld => ({
    id: uuid(`backup-${daysOld}`),
    path: 'https://url-backup',
    size: 2024000100 - daysOld * 8412000,
    created_at: daysAgo(daysOld),
    updated_at: daysAgo(daysOld),
    is_deleted: false
  })),
  'get /api/v1/variable/GLADYS_GATEWAY_BACKUP_KEY': {
    value: 'ad793dc660683701703409f97fd1d2f9j86610467839e12a0107c0409ec7240bb'
  },
  'get /api/v1/gateway/instance/key': {
    rsa_fingerprint: '33:ab:6d:4c:2d:5e:43:26:2c:48:25:63:54:c9:2f:e1:76:97:60:ea:9b:fa:63:f4:03:78:99:09:27:1b:d8:14',
    ecdsa_fingerprint: '42:b0:74:47:b5:60:14:a0:37:94:db:83:2d:de:a4:51:58:ad:6f:c9:6e:6f:0b:54:82:d1:f3:bf:cf:99:6c:3f'
  },
  'get /api/v1/gateway/key': [
    {
      id: 'b2594fc0-9812-477c-ba8f-6059a91d6932',
      name: 'Pepper Pots',
      rsa_public_key: 'fa:f9:5b:80:69:8d:c3:d7:4b:cc:33:7b:5d:ba:98:9b:17:22:76:f8:f3:79:db:6b:b8:53:37:ec:2a:cf:18:fd',
      ecdsa_public_key:
        'cf:df:75:79:a0:93:74:f4:e2:d7:b8:74:ab:67:7b:80:6e:57:1d:ef:bc:38:5d:70:8b:cf:dd:ba:88:c8:d6:f4',
      gladys_4_user_id: null,
      connected: true,
      accepted: true
    },
    {
      id: 'adf4f481-1b19-4796-bab3-fbabfc4775d5',
      name: 'Tony Stark',
      rsa_public_key: '51:89:e6:91:4f:da:f8:d6:b6:f6:1e:15:54:c4:c0:fd:cc:69:70:81:d4:a8:ea:26:8b:02:4b:b9:ff:97:64:1a',
      ecdsa_public_key:
        '2e:e9:ee:a0:b3:22:46:62:f8:22:9b:52:9d:f4:3f:65:70:62:59:76:d1:85:ad:3b:9f:65:4e:61:4c:26:89:7e',
      gladys_4_user_id: null,
      connected: true,
      accepted: true
    }
  ],
  'get /api/v1/ping': {},
  'get /api/v1/system/info': {
    hostname: 'Raspberry Pi 4',
    type: 'Linux',
    platform: 'linux',
    arch: 'x64',
    release: '18.5.0',
    uptime: 662555,
    loadavg: [1.908203125, 3.01513671875, 3.64013671875],
    totalmem: 17179869184,
    freemem: 492482560,
    cpus: [
      {
        model: 'ARM Cortex-A72',
        speed: 1800,
        times: {
          user: 34606730,
          nice: 0,
          sys: 24855850,
          idle: 100527470,
          irq: 0
        }
      },
      {
        model: 'ARM Cortex-A72',
        speed: 1800,
        times: {
          user: 22568450,
          nice: 0,
          sys: 10605290,
          idle: 126800520,
          irq: 0
        }
      },
      {
        model: 'ARM Cortex-A72',
        speed: 1800,
        times: {
          user: 34765800,
          nice: 0,
          sys: 20890230,
          idle: 104318270,
          irq: 0
        }
      },
      {
        model: 'ARM Cortex-A72',
        speed: 1800,
        times: {
          user: 18691910,
          nice: 0,
          sys: 8683980,
          idle: 132598350,
          irq: 0
        }
      }
    ],
    network_interfaces: {},
    nodejs_version: 'v24.4.1',
    // The version of the branch the demo was built from, so the system page
    // never announces a release from years ago
    gladys_version: `v${GLADYS_VERSION}`,
    is_docker: true,
    new_release_available: false
  },
  'get /api/v1/system/disk': {
    filesystem: '/dev/disk1s1',
    size: 499313172480,
    used: 464613756928,
    available: 28587036672,
    capacity: 0.953000005,
    mountpoint: '/'
  },
  'get /api/v1/system/container': [
    {
      name: '/gladys',
      state: 'running',
      id: '9e5f09775f897624deb1eb2ec8688c1b300d81bc3727fc71ae3290d3d8f71fa9',
      created_at: 1561506899
    }
  ],
  'get /api/v1/session': [
    {
      useragent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      minutesOld: 35
    },
    {
      useragent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      minutesOld: 220
    },
    {
      useragent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      minutesOld: 1500
    },
    {
      useragent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      minutesOld: 4300
    }
  ].map(({ useragent, minutesOld }, index) => ({
    id: uuid(`session-${index}`),
    token_type: 'refresh_token',
    scope: ['dashboard:write', 'dashboard:read'],
    valid_until: dayjs()
      .add(30, 'day')
      .toISOString(),
    last_seen: minutesAgo(minutesOld),
    revoked: false,
    useragent,
    created_at: minutesAgo(minutesOld),
    updated_at: minutesAgo(minutesOld)
  })),
  'get /api/v1/setup': {
    account_configured: true
  },
  'get /api/v1/job': [
    {
      id: 'f69252f4-1216-4021-8fc0-83234da71a4a',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: 'b2d590aa-40d7-435a-910a-cf370dde06a9',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 98,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: 'd1e7ee47-229c-4b9f-bbaa-201db860cc25',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(1, 'hour')
        .toISOString()
    },
    {
      id: '06411e01-a909-4531-9246-2e935c16ba69',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: '10469873-569a-4dfb-b35c-4468c26542a4',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: '5307b306-8d95-41e3-9ec6-a5c29d386c9b',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(2, 'hour')
        .toISOString()
    },
    {
      id: 'c3da516f-3565-4b00-be82-ddd00fe39a12',
      type: 'monthly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    },
    {
      id: '5ca896b5-e810-48f5-bfb6-f3039a6776c5',
      type: 'daily-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    },
    {
      id: 'ae916efe-6209-49cb-a2fc-323f3ab5f91d',
      type: 'hourly-device-state-aggregate',
      status: 'success',
      progress: 100,
      data: {},
      created_at: dayjs()
        .subtract(3, 'hour')
        .toISOString()
    }
  ]
};

export default system;
