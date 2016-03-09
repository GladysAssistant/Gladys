
module.exports = {
  get: `SELECT * FROM box WHERE user = ? ORDER BY y;`,
  delete: 'DELETE FROM box WHERE id = ?;'  
};