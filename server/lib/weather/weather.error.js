class NoWeatherFoundError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}
module.exports = {
  NoWeatherFoundError,
};
