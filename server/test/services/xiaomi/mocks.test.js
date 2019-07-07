const MockedClient = {
  create: function create() {
    return {
      get: (url) => Promise.resolve(true),
    };
  },
};

module.exports = MockedClient;
