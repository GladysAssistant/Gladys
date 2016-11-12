
module.exports = {
  get: `SELECT *, box.id as boxId FROM box 
  JOIN boxtype ON (box.boxtype = boxtype.id)
  WHERE user = ? AND active = 1 AND view = ? ORDER BY y;`,
  getBoxUser: `
    SELECT box.*, boxtype.id as boxTypeId, boxtype.title as boxTypeTitle
    FROM box
    JOIN boxtype ON (box.boxtype = boxtype.id)
    WHERE user = ?;
  `,
  delete: 'DELETE FROM box WHERE id = ?;'  
};