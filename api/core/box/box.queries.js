
module.exports = {
  get: `SELECT * FROM box 
  JOIN boxtype ON (box.boxtype = boxtype.id)
  WHERE user = ? AND active = 1 AND view = ? ORDER BY y;`,
  delete: 'DELETE FROM box WHERE id = ?;'  
};