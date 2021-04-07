const postUpdate = function postUpdate(device) {
  this.disconnect(device);
  this.connect(device);
};

module.exports = postUpdate;
