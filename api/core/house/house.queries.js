

module.exports = {
  delete: 'DELETE FROM house WHERE id = ?;',
  get: `
    SELECT * FROM house
    WHERE user = ?
    LIMIT ?
    OFFSET ?;
  `
};