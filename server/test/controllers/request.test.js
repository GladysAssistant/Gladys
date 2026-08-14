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

// Every seeded user is an admin: a test needing a non-admin user creates it
// itself with this id, then requests the API with `nonAdminRequest`.
const NON_ADMIN_USER_ID = 'e2c4a6d0-1f2b-4d8e-9a3c-5b7e8f0a1c2d';
const nonAdminHeader = `Bearer ${generateAccessToken(
  NON_ADMIN_USER_ID,
  ['dashboard:write'],
  'baf1fa89-153b-4f2e-adf3-787e410ec291',
  'secret',
)}`;

const authenticatedRequest = {
  // @ts-ignore
  get: (url) => request(TEST_BACKEND_APP).get(url).set('Accept', 'application/json').set('Authorization', header),
  // @ts-ignore
  post: (url) => request(TEST_BACKEND_APP).post(url).set('Accept', 'application/json').set('Authorization', header),
  // @ts-ignore
  patch: (url) => request(TEST_BACKEND_APP).patch(url).set('Accept', 'application/json').set('Authorization', header),
  // @ts-ignore
  delete: (url) => request(TEST_BACKEND_APP).delete(url).set('Accept', 'application/json').set('Authorization', header),
};

const nonAdminRequest = {
  // @ts-ignore
  get: (url) =>
    request(TEST_BACKEND_APP).get(url).set('Accept', 'application/json').set('Authorization', nonAdminHeader),
  // @ts-ignore
  post: (url) =>
    request(TEST_BACKEND_APP).post(url).set('Accept', 'application/json').set('Authorization', nonAdminHeader),
  // @ts-ignore
  delete: (url) =>
    request(TEST_BACKEND_APP).delete(url).set('Accept', 'application/json').set('Authorization', nonAdminHeader),
};

const unAuthenticatedRequest = {
  // @ts-ignore
  get: (url) => request(TEST_BACKEND_APP).get(url).set('Accept', 'application/json'),
  // @ts-ignore
  post: (url) => request(TEST_BACKEND_APP).post(url).set('Accept', 'application/json'),
  // @ts-ignore
  patch: (url) => request(TEST_BACKEND_APP).patch(url).set('Accept', 'application/json'),
  // @ts-ignore
  delete: (url) => request(TEST_BACKEND_APP).delete(url).set('Accept', 'application/json'),
};

module.exports = {
  authenticatedRequest,
  nonAdminRequest,
  NON_ADMIN_USER_ID,
  request: unAuthenticatedRequest,
  alarmModeToken,
};
