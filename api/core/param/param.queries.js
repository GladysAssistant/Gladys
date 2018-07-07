
module.exports = {
  getValue: 'SELECT * FROM param WHERE name = ?;' ,
  delete: 'DELETE FROM param WHERE name = ?;' ,
  get: `
    SELECT * FROM param WHERE ( type != 'secret' OR type IS NULL)
  `,
  getByModule: `
    SELECT * FROM param
    WHERE module = ?
    AND ( type != 'secret' OR type IS NULL)
  `
};