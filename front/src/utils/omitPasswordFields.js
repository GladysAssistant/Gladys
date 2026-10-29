// Fields of the profile form holding the password the user typed: they are only
// sent to the server, never kept in the stored user (persisted in localStorage)
const PASSWORD_FIELDS = ['password', 'passwordRepeat'];

function hasPasswordFields(user) {
  return Boolean(user) && PASSWORD_FIELDS.some(field => Object.prototype.hasOwnProperty.call(user, field));
}

function omitPasswordFields(user) {
  if (!hasPasswordFields(user)) {
    return user;
  }
  const cleanUser = Object.assign({}, user);
  PASSWORD_FIELDS.forEach(field => {
    delete cleanUser[field];
  });
  return cleanUser;
}

export { hasPasswordFields, omitPasswordFields };
