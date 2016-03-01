
module.exports = {
  deleteScript: 'DELETE FROM script WHERE id = ?;',
  getScripts: 'SELECT * FROM script WHERE user = ? LIMIT ? OFFSET ?;',
  getById: 'SELECT * FROM script WHERE id = ? AND user = ?;'  
};