
module.exports = {
  getAll: 'SELECT * FROM sentence WHERE (status = "official" OR status = "approved") ORDER BY id DESC;',
  getByUuid: 'SELECT * FROM sentence WHERE uuid = ?;',
  getByText: 'SELECT * FROM sentence WHERE lower(text) = lower(?);',
  get: 'SELECT * FROM sentence LIMIT ? OFFSET ?;',
  getOffical: 'SELECT * FROM sentence WHERE status="official" ORDER BY id DESC LIMIT ? OFFSET ?;',
  getApproved: 'SELECT * FROM sentence WHERE status="approved" ORDER BY id DESC LIMIT ? OFFSET ?;',
  getRejected: 'SELECT * FROM sentence WHERE status="rejected" ORDER BY id DESC LIMIT ? OFFSET ?;',
  getPending: 'SELECT * FROM sentence WHERE status="pending" ORDER BY id DESC LIMIT ? OFFSET ?;',
  getLabels: 'SELECT DISTINCT label, service from sentence;',
  cleanSentencesTable: 'DELETE FROM sentence;'
};
