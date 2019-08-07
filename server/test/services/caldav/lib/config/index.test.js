const { expect } = require('chai');
const sinon = require('sinon');
const { config } = require('../../../../../services/caldav/lib/config/index');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

describe('CalDAV config', () => {
  const configEnv = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    config,
    gladys: {
      variable: {
        getValue: sinon.stub(),
      },
    },
    iCloud: sinon.stub().returns({ url: 'https://p01-caldav.icloud.com' }),
  };

  it('should config apple url', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_HOST', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('apple');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');
    const result = await configEnv.config(userId);
    expect(result).to.deep.equal({ url: 'https://p01-caldav.icloud.com' });
  });

  it('should check config', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_HOST', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('other');
    const result = await configEnv.config(userId);
    expect(result).to.deep.equal({});
  });
});
