
module.exports = {
  getAll: 'SELECT * FROM sentence;',
  getByUuid: 'SELECT * FROM sentence WHERE uuid = ?;',
  getByText: 'SELECT * FROM sentence WHERE lower(text) = lower(?);',
  get: 'SELECT * FROM sentence LIMIT ? OFFSET ?;',
  getLabels: 'SELECT DISTINCT label from sentence;',
  cleanSentencesTable: 'DELETE FROM sentence;'
};