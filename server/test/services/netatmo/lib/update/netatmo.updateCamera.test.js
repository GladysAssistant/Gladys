const { fake } = require('sinon');
const nock = require('nock');
const axios = require('axios');
const fse = require('fs-extra');
const FfmpegMock = require('./FfmpegMock.test');
const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
  event: {
    emit: fake.returns(null),
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
    getBySelector: undefined,
  },
};

describe('netatmoManager updateCamera', () => {
  const netatmoManager = new NetatmoManager(gladys, FfmpegMock, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  before(async () => {
    await fse.ensureDir(gladys.config.tempFolder);
  });
  it('should say error device undefined', async () => {
    netatmoManager.devices = {
      '10': {
        name: 'Camera Stark room',
        type: 'toto',
      },
    };
    await netatmoManager.updateCamera('10', undefined, 'netatmo-10');
  });

  it('should have device defined', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'toto',
        alim_status: 'off',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      selector: 'netatmo-10',
      type: 'toto',
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: '1',
        },
      ],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should have device but failed on get axios - error code 400', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'toto',
        alim_status: 'off',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'toto',
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: 'off',
        },
      ],
    };
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(400, 'error');
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should have device NACamera or NOC and update powerValue', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'toto',
        alim_status: 'off',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'toto',
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: 'on',
        },
      ],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should add camera NOC and success update all feature with change value', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark Outdoor',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NOC',
        alim_status: 'off',
        light_mode_status: 'off',
        siren_status: 'no_news',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      model: 'NOC',
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: '1',
        },
        {
          selector: 'netatmo-10-light',
          last_value: '1',
        },
        {
          selector: 'netatmo-10-siren',
          last_value: '0',
        },
      ],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should add camera NOC and success update all feature without change value but only change date value', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark Outdoor',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NOC',
        alim_status: 'off',
        light_mode_status: 'auto',
        siren_status: 'no_news',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      model: 'NOC',
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: '0',
        },
        {
          selector: 'netatmo-10-light',
          last_value: '2',
        },
        {
          selector: 'netatmo-10-siren',
          last_value: '-1',
        },
      ],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should add camera NOC and failed features update on "Cannot read property last_value of null"', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark Outdoor',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NOC',
        alim_status: 'off',
        light_mode_status: 'off',
        siren_status: 'no_news',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'NOC',
      features: [],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should add camera NOC and failed feature update on "Cannot read property toUpperCase of undefined or other"', async () => {
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark Outdoor',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NOC',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'NOC',
      features: [],
    };
    const responseImage = await axios.get(
      'https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg',
      {
        responseType: 'arraybuffer',
      },
    );
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(200, responseImage.data);
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should failed update features NIS on "no save in DB"', async () => {
    const device = undefined;
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            name: 'Siren Stark room',
            type: 'NIS',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should success update device module NIS and success update all feature with change value', async () => {
    const device = undefined;
    const module = {
      id: '11',
      selector: 'netatmo-11',
      features: [
        {
          selector: 'netatmo-11-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-siren',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '11',
            name: 'Siren Stark room',
            type: 'NIS',
            battery_percent: 100,
            status: 'sound',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should success update device module NIS and success update all feature without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '11',
      selector: 'netatmo-11',
      features: [
        {
          selector: 'netatmo-11-battery',
          last_value: 50,
        },
        {
          selector: 'netatmo-11-siren',
          last_value: 2,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '11',
            name: 'Siren Stark room',
            type: 'NIS',
            battery_percent: 100,
            status: 'warning',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should success update device module NACamDoorTag and success update all feature with change value', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
      features: [
        {
          selector: 'netatmo-12-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-doortag',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '12',
            name: 'Door tag Stark room',
            type: 'NACamDoorTag',
            battery_percent: 100,
            status: 'open',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should success update device module NACamDoorTag and success update all feature without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
      features: [
        {
          selector: 'netatmo-12-battery',
          last_value: 100,
        },
        {
          selector: 'netatmo-12-doortag',
          last_value: -1,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '12',
            name: 'Door tag Stark room',
            type: 'NACamDoorTag',
            battery_percent: 100,
            status: 'undefined',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should failed update features NACamDoorTag and NIS on "Cannot read property last_value of null"', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '11',
            name: 'Siren Stark room',
            type: 'NIS',
            battery_percent: 100,
            status: 'on',
          },
          {
            id: '12',
            name: 'Door tag Stark room',
            type: 'NACamDoorTag',
            battery_percent: 100,
            status: 'on',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should failed update features NACamDoorTag and NIS on "Cannot read property toUpperCase of undefined or other"', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
        modules: [
          {
            id: '11',
            name: 'Siren Stark room',
            type: 'NIS',
          },
          {
            id: '12',
            name: 'Door tag Stark room',
            type: 'NACamDoorTag',
          },
        ],
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should failed global module of NACamera on "Cannot read property forEach of undefined"', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        id: '10',
        name: 'Camera Stark room',
        vpn_url: 'https://fake.gladys.fr',
        type: 'NACamera',
      },
    };
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });
});
