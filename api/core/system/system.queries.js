
module.exports = {
  getNumberOfDeviceTypes: 'SELECT COUNT(id) as count FROM devicetype;',
  getNumberOfDeviceStates: 'SELECT COUNT(id) as count FROM devicestate;'
};