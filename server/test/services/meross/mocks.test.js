const logger = require('../../../utils/logger');

const MockedClient = {
  create: function create() {
    return {
      post: (url) => Promise.resolve(logger.info(`Changing light state, calling ${url}`)),
      get: (url) => Promise.resolve(true),
    };
  },
};

module.exports = MockedClient;
