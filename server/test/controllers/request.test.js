const request = require('supertest');
const { generateAccessToken } = require('../../utils/accessToken');

const token = generateAccessToken(
  '0cd30aef-9c4e-4a23-88e3-3547971296e5',
  ['dashboard:write', 'reset-password:write'],
  'baf1fa89-153b-4f2e-adf3-787e410ec291',
  'secret',
);
const header = `Bearer ${token}`;

const alarmModeToken = generateAccessToken(
  '0cd30aef-9c4e-4a23-88e3-3547971296e5',
  ['alarm:write'],
  'baf1fa89-153b-4f2e-adf3-787e410ec291',
  'secret',
);

const authenticatedRequest = {
  // @ts-ignore
  get: (url) =>
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', header),
  // @ts-ignore
  post: (url) =>
    request(TEST_BACKEND_APP)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', header),
  // @ts-ignore
  patch: (url) =>
    request(TEST_BACKEND_APP)
      .patch(url)
      .set('Accept', 'application/json')
      .set('Authorization', header),
  // @ts-ignore
  delete: (url) =>
    request(TEST_BACKEND_APP)
      .delete(url)
      .set('Accept', 'application/json')
      .set('Authorization', header),
};

const unAuthenticatedRequest = {
  // @ts-ignore
  get: (url) =>
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json'),
  // @ts-ignore
  post: (url) =>
    request(TEST_BACKEND_APP)
      .post(url)
      .set('Accept', 'application/json'),
  // @ts-ignore
  patch: (url) =>
    request(TEST_BACKEND_APP)
      .patch(url)
      .set('Accept', 'application/json'),
  // @ts-ignore
  delete: (url) =>
    request(TEST_BACKEND_APP)
      .delete(url)
      .set('Accept', 'application/json'),
};

module.exports = {
  authenticatedRequest,
  request: unAuthenticatedRequest,
  alarmModeToken,
};
