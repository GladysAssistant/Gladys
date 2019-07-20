const { expect } = require('chai');
const sinon = require('sinon');
const { connect } = require('../../../services/caldav/lib/calendar/connect');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';

const accountRequest = {
  server: 'https://caldav.tonystark.com',
  accountType: 'caldav',
  loadCollections: true,
  loadObjects: true,
  filters: [
    {
      type: 'comp-filter',
      attrs: { name: 'VCALENDAR' },
      children: [
        {
          type: 'comp-filter',
          attrs: { name: 'VEVENT' },
          children: [
            {
              type: 'time-range',
              attrs: { start: '20180625T220000Z' },
            },
          ],
        },
      ],
    },
  ],
};

describe('CalDAV connect', () => {
  const connecter = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    connect,
    gladys: {
      variable: {
        getValue: sinon.stub(),
      },
    },
    dav: {
      transport: {
        Basic: sinon.stub().returns({ xhr: 'xhr' }),
      },
      Credentials: sinon.stub().returns({ credentials: 'credentials' }),
      Client: sinon.stub(),
    },
  };

  connecter.gladys.variable.getValue
    .withArgs('CALDAV_URL', connecter.serviceId, userId)
    .returns('https://caldav.tonystark.com');
  connecter.gladys.variable.getValue.withArgs('CALDAV_USERNAME', connecter.serviceId, userId).returns('tony');
  connecter.gladys.variable.getValue.withArgs('CALDAV_PASSWORD', connecter.serviceId, userId).returns('p3pp3r');
  const createAccount = sinon.stub().resolves({ calendars: ['calendar1', 'calendar2', 'calendar3'] });
  connecter.dav.Client.returns({ createAccount });

  it('should start connection', async () => {
    const clock = sinon.useFakeTimers(new Date(2019, 5, 26).getTime());
    const accountConnected = await connecter.connect(userId);
    expect(createAccount.args[0][0]).to.eql(accountRequest);
    expect(accountConnected).to.eql({ calendars: ['calendar1', 'calendar2', 'calendar3'] });
    clock.restore();
  });
});
