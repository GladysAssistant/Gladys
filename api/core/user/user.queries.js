
module.exports = {
  getByEmail: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user WHERE email = ?;',
  get: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user LIMIT ? OFFSET ?;' ,
  getAdmin: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user WHERE role = "admin";',
  getById: 'SELECT id, firstname, lastname, email, birthdate, gender, language, assistantName, preparationTimeAfterWakeUp, role, createdAt, updatedAt FROM user WHERE id = ?;',
  delete: 'DELETE FROM user WHERE id = ?;' 
};