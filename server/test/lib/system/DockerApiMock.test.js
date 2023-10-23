const sinon = require('sinon');

const { fake } = sinon;

const containers = [
  {
    Id: 'a8293feec54547a797aa2e52cc14b93f89a007d6c5608c587e30491feec8ee61',
    Names: ['/Gladys'],
    Image: 'gladysassistant/gladys-4-playground',
    ImageID: 'sha256:c6b7806e6eeff9375d30b6cd6e5e5bcebffd988d7c85a0fd772daa3ffac58fee',
    Command: 'docker-entrypoint.sh npm run start:prod',
    Created: 1588951418,
    Ports: [],
    Labels: {
      'org.label-schema.build-date': '',
      'org.label-schema.version': '',
    },
    State: 'running',
    Status: 'Up 16 hours',
    HostConfig: {
      NetworkMode: 'host',
      Devices: [
        {
          PathOnHost: '/dev/ttyUSB0',
          PathInContainer: '/dev/ttyACM0',
          CgroupPermissions: 'rwm',
        },
      ],
    },
    Mounts: [
      {
        Source: '/home/myname/gladys',
        Destination: '/var/lib/gladysassistant',
      },
    ],
    NetworkSettings: {
      Networks: {
        host: {
          IPAMConfig: null,
          Links: null,
          Aliases: null,
          NetworkID: '583393ca27dcfa24bd29c0cc958bc3e0971623e510ec563d7cb95c1f2cd5ce82',
          EndpointID: 'd5ca48381da31080a479c112fab734237b630e6040f8bdc69d6ff34072ea2b2d',
          Gateway: '',
          IPAddress: '',
          IPPrefixLen: 0,
          IPv6Gateway: '',
          GlobalIPv6Address: '',
          GlobalIPv6PrefixLen: 0,
          MacAddress: '',
          DriverOpts: null,
        },
      },
    },
    SizeRw: 152635,
  },
  {
    Id: 'b594e692-e6d3-4531-bdcc-f0afcf515113',
    Names: ['/watchtower'],
    Image: 'containrrr/watchtower',
  },
];

const images = [
  {
    Id: '0f72aecf-4a85-4b00-86c4-43dbdf9c8c05',
    RepoTags: ['gladysassistant/gladys-4-playground'],
  },
  {
    Id: '3eb811ca-e050-4324-a6fa-a7a09141b4fa',
    RepoTags: ['containrrr/watchtower'],
  },
];

const networks = [
  {
    Name: 'network',
    Id: '7841509454e7056452b2282d10c915cccbe99ffb53c933a09719d15e6b723a47',
    Created: '2020-01-05T12:06:02.142135588+01:00',
    Scope: 'local',
    Driver: 'null',
    EnableIPv6: false,
    IPAM: {
      Driver: 'default',
      Options: null,
      Config: [],
    },
    Internal: false,
    Attachable: false,
    Ingress: false,
    ConfigFrom: {
      Network: '',
    },
    ConfigOnly: false,
    Containers: {},
    Options: {},
    Labels: {},
    connect: fake.resolves(true),
    inspect: fake.resolves(true),
  },
];

module.exports = {
  containers,
  images,
  networks,
};
