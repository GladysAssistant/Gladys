const ServerMock = require('mock-http-server');
const { OAUTH2 } = require('../../../../services/withings/lib/oauth2-client/utils/constants.js');

/**
 *
 * @description Return a json measure with specified type.
 *
 * @param {number} type - Type of measure need.
 * @returns {Object} Json measure.
 * @example getWithingsMeasure(1);
 */
function getWithingsMeasure(type) {
  return {
    value: 0,
    type,
    unit: 0,
    algo: 0,
    fm: 0,
    fw: 0,
  };
}

/**
 * @description Return a HttpServer corresponding to withings server
 *
 * @param {string} host - Host of server.
 * @param {number} port - Port of server.
 * @param {boolean} withHistoricalData - Flag to choose if lot of historical data must be send in get measures.
 * @returns {Object} Return HTTP server instance.
 * @example serverHttpWithingsMock.getHttpServer('localhost', 9192 );
 */
function getHttpServer(host, port, withHistoricalData) {
  const server = new ServerMock({ host, port }, null);
  server.on({
    method: 'GET',
    path: '/v2/user',
    reply: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 0,
        body: {
          devices: [
            {
              type: 'string',
              model: 'string',
              model_id: 0,
              battery: 'low',
              deviceid: 'withingsDevideId',
              timezone: 'string',
              last_session_date: 0,
            },
            {
              type: 'string',
              model: 'string',
              model_id: 0,
              battery: 'no',
              deviceid: 'withingsDevideId2',
              timezone: 'string',
              last_session_date: 0,
            },
            {
              type: 'string',
              model: 'string',
              model_id: 0,
              battery: 'medium',
              deviceid: 'withingsDevideId3',
              timezone: 'string',
              last_session_date: 0,
            },
            {
              type: 'string',
              model: 'string',
              model_id: 0,
              battery: 'high',
              deviceid: 'withingsDevideId4',
              timezone: 'string',
              last_session_date: 0,
            },
          ],
        },
      }),
    },
  });

  let measures;
  if (withHistoricalData) {
    measures = [
      getWithingsMeasure(1),
      getWithingsMeasure(0),
      getWithingsMeasure(4),
      getWithingsMeasure(5),
      getWithingsMeasure(6),
      getWithingsMeasure(8),
      getWithingsMeasure(9),
      getWithingsMeasure(10),
      getWithingsMeasure(11),
      getWithingsMeasure(12),
      getWithingsMeasure(54),
      getWithingsMeasure(71),
      getWithingsMeasure(73),
      getWithingsMeasure(76),
      getWithingsMeasure(77),
      getWithingsMeasure(88),
      getWithingsMeasure(91),
    ];
  } else {
    measures = [getWithingsMeasure(1)];
  }
  server.on({
    method: 'GET',
    path: '/measure',
    reply: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 0,
        body: {
          updatetime: 'string',
          timezone: 'string',
          measuregrps: [
            {
              grpid: 0,
              attrib: 0,
              date: 0,
              created: 0,
              category: 1,
              deviceid: 'withingsDevideId',
              measures,
              comment: 'string',
            },
          ],
          more: true,
          offset: 0,
        },
      }),
    },
  });
  return server;
}

/**
 *
 * @description Return a HttpServer corresponding to withings server
 *
 * @param {string} key - Key of fariable to return.
 * @returns {string} Value of variable.
 * @example serverHttpWithingsMock.getHttgetVariablepServer(OAUTH2.VARIABLE.TOKEN_HOST, 'localhost', 9192 );
 */
function getVariable(key) {
  switch (key) {
    case OAUTH2.VARIABLE.ACCESS_TOKEN:
      return (
        '{' +
        '"access_token":"b96a86b654acb01c2aeb4d5a39f10ff9c964f8e4",' +
        '"expires_in":10800,' +
        '"token_type":"Bearer",' +
        '"scope":"user.info,user.metrics,user.activity,user.sleepevents",' +
        '"refresh_token":"11757dc7fd8d25889f5edfd373d1f525f53d4942",' +
        '"userid":"33669966",' +
        '"expires_at":"2020-11-13T20:46:50.042Z"' +
        '}'
      );
    case OAUTH2.VARIABLE.CLIENT_ID:
      return 'fake_client_id';
    default:
      return '';
  }
}

module.exports = {
  getHttpServer,
  getVariable,
};
