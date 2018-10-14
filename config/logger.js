// Raspberry Pi model B/B+ are slow, they need a longer timeout
module.exports.logger = {
  _hookTimeout: 1800000
};
