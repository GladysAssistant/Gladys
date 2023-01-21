const { send } = require('./notification.send');

const Notification = function Notification(service) {
  this.service = service;
};

Notification.prototype.send = send;

module.exports = Notification;
