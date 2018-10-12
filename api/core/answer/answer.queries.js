
module.exports = {
  getByUuid: `SELECT * FROM answer WHERE uuid = ?;`,
  cleanAnswers: 'DELETE FROM answer;'
};