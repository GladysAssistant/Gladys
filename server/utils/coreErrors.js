class PasswordNotMatchingError extends Error {
  constructor() {
    super();
    this.message = 'Password are not matching';
  }
}

class NotAuthorizedResourceError extends Error {
  constructor() {
    super();
    this.message = 'Resource is not public';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class NoValuesFoundError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class ServiceNotConfiguredError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class PlatformNotCompatible extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class BadParameters extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class AbortScene extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

module.exports = {
  PasswordNotMatchingError,
  NotAuthorizedResourceError,
  NotFoundError,
  ServiceNotConfiguredError,
  BadParameters,
  NoValuesFoundError,
  PlatformNotCompatible,
  AbortScene,
};
