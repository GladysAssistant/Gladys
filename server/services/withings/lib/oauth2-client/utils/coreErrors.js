class BadOauth2ClientResponse extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

module.exports = {
  BadOauth2ClientResponse,
};
