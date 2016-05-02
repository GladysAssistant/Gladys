

module.exports = {
  delete: 'DELETE FROM house WHERE id = ?;',
  get: `SELECT * FROM house LIMIT ? OFFSET ?;`,
  getAll: `SELECT * FROM house;`
};