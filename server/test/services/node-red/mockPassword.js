module.exports = {
  hash: (password) =>
    new Promise((resolve, reject) => {
      resolve(password);
    }),
  compare: (password, hash) =>
    new Promise((resolve, reject) => {
      resolve(true);
    }),
  generate: () => 'password',
};
