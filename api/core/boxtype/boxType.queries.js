
module.exports = {
  getAll: 'SELECT * FROM boxtype;',
  delete: 'DELETE FROM boxtype WHERE id = ?;',
  getByUuid: 'SELECT * FROM boxtype WHERE uuid = ?;'
};