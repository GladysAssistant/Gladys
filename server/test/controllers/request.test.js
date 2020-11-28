const request = require('supertest');
const { generateAccessToken } = require('../../utils/accessToken');

const token = generateAccessToken(
  '0cd30aef-9c4e-4a23-88e3-3547971296e5',
  ['dashboard:write', 'reset-password:write'],
  'baf1fa89-153b-4f2e-adf3-787e410ec291',
  'secret',
);
const header = `Bearer ${token}`;

const oauthToken = generateAccessToken(
  '0cd30aef-9c4e-4a23-88e3-3547971296e5',
  ['dashboard:write'],
  'd7a30cc5-b862-44fe-8a37-23420d14533e',
  'secret',
);
const oauthHeader = `Bearer ${oauthToken}`;

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

const oauthAuthenticatedRequest = {
  // @ts-ignore
  get: (url) =>
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', oauthHeader),
  // @ts-ignore
  post: (url) =>
    request(TEST_BACKEND_APP)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', oauthHeader),
  // @ts-ignore
  patch: (url) =>
    request(TEST_BACKEND_APP)
      .patch(url)
      .set('Accept', 'application/json')
      .set('Authorization', oauthHeader),
  // @ts-ignore
  delete: (url) =>
    request(TEST_BACKEND_APP)
      .delete(url)
      .set('Accept', 'application/json')
      .set('Authorization', oauthHeader),
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
  oauthAuthenticatedRequest,
  request: unAuthenticatedRequest,
};
