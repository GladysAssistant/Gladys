const { getByType } = require('./remote-control.getByType');

const RemoteControl = function RemoteControl() {};

RemoteControl.prototype.getByType = getByType;

module.exports = RemoteControl;
