const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const { config } = require('../../../../../services/caldav/lib/config/index');

chai.use(chaiAsPromised);
const { expect } = chai;

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const namespace = {
  CALENDAR_SERVER: 'http://calendarserver.org/ns/',
  CALDAV_APPLE: 'http://apple.com/ns/ical/',
  CALDAV: 'urn:ietf:params:xml:ns:caldav',
  CARDDAV: 'urn:ietf:params:xml:ns:carddav',
  DAV: 'DAV:',
};

describe('CalDAV config', () => {
  let send;
  let configEnv;
  before(() => {
    send = sinon.stub();
    configEnv = {
      serviceId: '5d6c666f-56be-4929-9104-718a78556844',
      config,
      gladys: {
        variable: {
          getValue: sinon.stub(),
          setValue: sinon.stub(),
        },
      },
      dav: {
        ns: namespace,
        transport: {
          Basic: sinon.stub().returns({
            send,
          }),
        },
        Credentials: sinon.stub(),
        request: {
          propfind: sinon.stub(),
        },
      },
    };
  });

  it('should config URLs', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    send
      .withArgs('request1', 'https://caldav.host.com')
      .returns({ props: { currentUserPrincipal: 'https://caldav.host.com/principal' } })
      .withArgs('request2', 'https://caldav.host.com/principal')
      .returns({ props: { calendarHomeSet: '/home' } });

    configEnv.dav.request.propfind
      .withArgs({
        props: [{ name: 'current-user-principal', namespace: namespace.DAV }],
        depth: 0,
        mergeResponses: true,
      })
      .returns('request1')
      .withArgs({
        props: [{ name: 'calendar-home-set', namespace: namespace.CALDAV }],
        depth: 0,
        mergeResponses: true,
      })
      .returns('request2');

    await configEnv.config(userId);
    expect(configEnv.gladys.variable.setValue.callCount).to.equal(2);
    expect(configEnv.gladys.variable.setValue.args[0]).to.eql([
      'CALDAV_PRINCIPAL_URL',
      'https://caldav.host.com/principal',
      configEnv.serviceId,
      userId,
    ]);
    expect(configEnv.gladys.variable.setValue.args[1]).to.eql([
      'CALDAV_HOME_URL',
      'https://caldav.host.com/home',
      configEnv.serviceId,
      userId,
    ]);
  });

  it('should failed if no CALDAV_URL', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns(undefined);
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    await expect(configEnv.config(userId)).to.be.rejectedWith(Error, 'MISSING_PARAMETERS');
  });

  it('should failed to get CALDAV_PRINCIPAL_URL', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    send.withArgs('request1', 'https://caldav.host.com').rejects();

    configEnv.dav.request.propfind
      .withArgs({
        props: [{ name: 'current-user-principal', namespace: namespace.DAV }],
        depth: 0,
        mergeResponses: true,
      })
      .returns('request1');

    await expect(configEnv.config(userId)).to.be.rejectedWith(Error, 'CALDAV_BAD_SETTINGS_PRINCIPAL_URL');
  });

  it('should failed to get CALDAV_HOME_URL', async () => {
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    configEnv.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    send
      .withArgs('request1', 'https://caldav.host.com')
      .returns({ props: { currentUserPrincipal: 'https://caldav.host.com/principal' } })
      .withArgs('request2', 'https://caldav.host.com/principal')
      .rejects();

    configEnv.dav.request.propfind
      .withArgs({
        props: [{ name: 'current-user-principal', namespace: namespace.DAV }],
        depth: 0,
        mergeResponses: true,
      })
      .returns('request1')
      .withArgs({
        props: [{ name: 'calendar-home-set', namespace: namespace.CALDAV }],
        depth: 0,
        mergeResponses: true,
      })
      .returns('request2');

    await expect(configEnv.config(userId)).to.be.rejectedWith(Error, 'CALDAV_BAD_SETTINGS_HOME_URL');
  });
});
