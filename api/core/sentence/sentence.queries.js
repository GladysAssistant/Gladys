
module.exports = {
  getAll: 'SELECT * FROM sentence WHERE (status = "official" OR status = "approved");',
  getByUuid: 'SELECT * FROM sentence WHERE uuid = ?;',
  getByText: 'SELECT * FROM sentence WHERE lower(text) = lower(?);',
  get: 'SELECT * FROM sentence LIMIT ? OFFSET ?;',
  getOffical: 'SELECT * FROM sentence WHERE status="official" LIMIT ? OFFSET ?;',
  getApproved: 'SELECT * FROM sentence WHERE status="approved" LIMIT ? OFFSET ?;',
  getRejected: 'SELECT * FROM sentence WHERE status="rejected" LIMIT ? OFFSET ?;',
  getPending: 'SELECT * FROM sentence WHERE status="pending" LIMIT ? OFFSET ?;',
  getLabels: 'SELECT DISTINCT label, service from sentence;',
  cleanSentencesTable: 'DELETE FROM sentence;'
};