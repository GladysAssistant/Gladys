const { fake } = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

class WithingsHandler {}

WithingsHandler.prototype.listen = fake.returns(null);

const WithingsService = proxyquire('../../../services/withings', {
  './lib': WithingsHandler,
});

describe('withingsService', () => {
  const withingsService = WithingsService(
    {
      variable: {
        getValue: fake.returns(
          '{' +
            '"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4",' +
            '"expires_in":10800,' +
            '"token_type":"Bearer",' +
            '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
            '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
            '"userid":"33669966",' +
            '"expires_at":"2020-11-13T20:46:50.042Z"' +
            '}',
        ),
      },
    },
    '3ac129d9-a610-42f8-924f-3fe708001b3d',
  );
  it('should start service', async () => {
    await withingsService.start();
  });
  it('should stop service', async () => {
    await withingsService.stop();
  });

  let countSetValueCount = 0;
  const withingsServiceWithoutDBVar = WithingsService(
    {
      variable: {
        getValue: fake.returns(null),
        setValue: function returnValue(key, serviceId, userId) {
          countSetValueCount += 1;
        },
      },
    },
    '3ac129d9-a610-42f8-924f-3fe708001b3d',
  );
  it('should start service (without db var)', async () => {
    await withingsServiceWithoutDBVar.start();
    assert.equal(countSetValueCount, 8);
  });
  it('should stop service (without db var)', async () => {
    await withingsServiceWithoutDBVar.stop();
  });
});
