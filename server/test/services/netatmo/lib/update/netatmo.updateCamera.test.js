const { fake } = require('sinon');
const nock = require('nock');
const axios = require('axios');
const proxyquire = require('proxyquire').noCallThru();

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {
  sharp: fake.returns(null),
  btoa: fake.resolves(null),
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    camera: {
      setImage: fake.resolves(null),
    },
  },
};

describe('netatmoManager updateCamera', () => {
  it('should say error ', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {};
    netatmoManager.updateCamera('10', undefined, 'netatmo-10');
  });

  it('should have device defined', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {
      '10': {
        id: '10',
        vpn_url: 'https://fake.gladys.fr',
        type: 'toto',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'toto',
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

  it('should have device but failed on get axios', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {
      '10': {
        id: '10',
        vpn_url: 'https://fake.gladys.fr',
        type: 'toto',
      },
    };
    const device = {
      id: '10',
      vpn_url: 'https://fake.gladys.fr',
      type: 'toto',
    };
    nock('https://fake.gladys.fr')
      .get('/live/snapshot_720.jpg')
      .reply(400, 'error');
    await netatmoManager.updateCamera('10', device, 'netatmo-10');
  });

  it('should have device and update powerValue', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {
      '10': {
        id: '10',
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

  it('should add camera NOC and success update all feature', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {
      '10': {
        id: '10',
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
      features: [
        {
          selector: 'netatmo-10-power',
          last_value: 'on',
        },
        {
          selector: 'netatmo-10-light',
          last_value: 'on',
        },
        {
          selector: 'netatmo-10-siren',
          last_value: 'no_sound',
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

  it('should add camera NOC and failed feature update', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.devices = {
      '10': {
        id: '10',
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

  // it('should add camera NACamera and success update all feature', async () => {
  //   gladys.device.getBySelector = fake.resolves()
  //   const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  //   netatmoManager.devices = {
  //     '10': {
  //       id: '10',
  //       vpn_url: 'https://fake.gladys.fr',
  //       type: 'NACamera',
  //       modules: {
  //         id: '10',
  //         type: 'NIS'
  //       }
  //     }
  //   };
  //   const device = {
  //     id: '10',
  //     vpn_url: 'https://fake.gladys.fr',
  //     type: 'NACamera',
  //     features: [
  //       {
  //         selector: 'netatmo-10-power',
  //         last_value: 'on'
  //       },
  //       {
  //         selector: 'netatmo-10-light',
  //         last_value: 'on'
  //       },
  //       {
  //         selector: 'netatmo-10-siren',
  //         last_value: 'no_sound'
  //       }
  //     ]
  //   }
  //   const responseImage = await axios.get('https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg', {
  //     responseType: 'arraybuffer',
  //   });
  //   nock('https://fake.gladys.fr')
  //     .get('/live/snapshot_720.jpg')
  //     .reply(200, responseImage.data);
  //   await netatmoManager.updateCamera('10', device, 'netatmo-10');
  // });
  //
  // it('should add camera NACamera and failed feature update', async () => {
  //   const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  //   netatmoManager.devices = {
  //     '10': {
  //       id: '10',
  //       vpn_url: 'https://fake.gladys.fr',
  //       type: 'NACamera',
  //       alim_status: 'off',
  //       light_mode_status: 'off',
  //       siren_status: 'no_news'
  //     }
  //   };
  //   const device = {
  //     id: '10',
  //     vpn_url: 'https://fake.gladys.fr',
  //     type: 'NACamera',
  //     features: []
  //   }
  //   const responseImage = await axios.get('https://www.interactivesearchmarketing.com/wp-content/uploads/2014/06/png-vs-jpeg.jpg', {
  //     responseType: 'arraybuffer',
  //   });
  //   nock('https://fake.gladys.fr')
  //     .get('/live/snapshot_720.jpg')
  //     .reply(200, responseImage.data);
  //   await netatmoManager.updateCamera('10', device, 'netatmo-10');
  // });
});
