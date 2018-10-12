
module.exports = {
  delete: 'DELETE FROM action WHERE id = ?;',
  deleteParams: 'DELETE FROM actionparam WHERE action = ?;'
};