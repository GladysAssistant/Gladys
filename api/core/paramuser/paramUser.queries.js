
module.exports = {
  getValue: 'SELECT * FROM paramuser WHERE name = ? AND user = ?;',
  deleteValue: 'DELETE FROM paramuser WHERE name = ? AND user = ?;',
  get: 'SELECT * FROM paramuser WHERE user = ?;' 
};