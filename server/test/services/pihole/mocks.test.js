const FakePiholeSummary = require('./piholeSummary.json');

const MockedPihole = {
  create: function create() {
    return {
      get: (url) => Promise.resolve(FakePiholeSummary),
    };
  },
};

module.exports = MockedPihole;
