const { expect } = require('chai');
const sinon = require('sinon');
const icloud = require('../../../../../services/caldav/lib/config/iCloud');

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';
const appleId = 'tony.stark@icloud.com';
const password = '7a69-edb2-42ca-9e5e';

const postDatas = [
  `
    <propfind xmlns='DAV:'>
      <prop>
        <current-user-principal/>
      </prop>
    </propfind>
  `,
  `
    <propfind xmlns='DAV:' xmlns:cd='urn:ietf:params:xml:ns:caldav'>
      <prop>
        <cd:calendar-home-set/>
      </prop>
    </propfind>
  `,
];

describe('CalDAV config', () => {
  const iCloudRequestStub = sinon
    .stub(icloud, 'iCloudRequest')
    .onFirstCall()
    .resolves('xml')
    .onSecondCall()
    .resolves('xml2');

  const parseFromStringsStub = sinon.stub().returns({
    getElementsByTagName: sinon.stub().returns([
      {
        getElementsByTagName: sinon
          .stub()
          .onFirstCall()
          .returns([
            {
              childNodes: [{ nodeValue: 'stark-entreprise.com' }],
            },
          ])
          .onSecondCall()
          .returns([
            {
              childNodes: [{ nodeValue: 'https://p01-caldav.icloud.com:443' }],
            },
          ]),
      },
    ]),
  });

  const configEnv = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    iCloud: icloud.iCloud,
    gladys: {
      variable: {
        setValue: sinon.stub().resolves(),
      },
    },
    https: 'module-https',
    xmlDom: {
      DOMParser: sinon.stub().returns({ parseFromString: parseFromStringsStub }),
    },
  };

  it('should config apple url', async () => {
    const result = await configEnv.iCloud(userId, appleId, password);

    expect(iCloudRequestStub.getCall(0).args).to.eql([
      'module-https',
      '/',
      { appleId: 'tony.stark@icloud.com', password: '7a69-edb2-42ca-9e5e' },
      postDatas[0],
    ]);
    expect(iCloudRequestStub.getCall(1).args).to.eql([
      'module-https',
      'stark-entreprise.com',
      { appleId: 'tony.stark@icloud.com', password: '7a69-edb2-42ca-9e5e' },
      postDatas[1],
    ]);
    expect(configEnv.gladys.variable.setValue.getCall(0).args).to.eql([
      'CALDAV_URL',
      'https://p01-caldav.icloud.com',
      configEnv.serviceId,
      userId,
    ]);
    expect(result).to.eql({ url: 'https://p01-caldav.icloud.com' });
  });
});
