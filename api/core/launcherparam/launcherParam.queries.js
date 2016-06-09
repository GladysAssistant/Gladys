
module.exports = {
  getByEventType: 'SELECT * FROM launcherparam WHERE eventtype = ?;', 
  getByEventTypeAndVariable: 'SELECT * FROM launcherparam WHERE eventtype = ? AND variablename = ?;', 
};