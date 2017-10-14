
module.exports = {
  getAll: 'SELECT * FROM sentence;',
  getByUuid: 'SELECT * FROM sentence WHERE uuid = ?;',
  getByText: 'SELECT * FROM sentence WHERE lower(text) = lower(?);',
  cleanSentencesTable: 'DELETE FROM sentence;'
};