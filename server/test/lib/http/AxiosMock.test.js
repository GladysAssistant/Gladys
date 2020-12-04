const { fake } = require('sinon');

const axios = {
  request: fake.resolves({ data: { success: true }, status: 200 }),
};

module.exports = axios;
