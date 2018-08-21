
module.exports = {
  getByEmail: 'SELECT * FROM user WHERE email = ?;',
  get: 'SELECT id, firstname, lastname, CONCAT(firstname, " ", lastname) as name, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user;' ,
  getAdmin: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user WHERE role = "admin";',
  getById: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user WHERE id = ?;',
  getAllById: 'SELECT * FROM user WHERE id = ?;',
  delete: 'DELETE FROM user WHERE id = ?;',
  getParamUserByValue: 'SELECT * FROM paramuser WHERE value = ?;' 
};