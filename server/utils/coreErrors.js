class PasswordNotMatchingError extends Error {
  constructor() {
    super();
    this.message = 'Password are not matching';
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

class ConflictError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

class TooManyRequests extends Error {
  constructor(message, timeBeforeNext) {
    super();
    this.message = message;
    this.timeBeforeNext = timeBeforeNext;
  }
}

class ForbiddenError extends Error {
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

// A scene stopped on purpose. Subclasses AbortScene so existing handling still
// applies, but stays distinguishable from "condition not verified", which the
// if/while actions turn into a false condition instead of propagating.
class SceneStopped extends AbortScene {}

class ExternalIntegrationUnavailableError extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

module.exports = {
  PasswordNotMatchingError,
  NotFoundError,
  ServiceNotConfiguredError,
  BadParameters,
  NoValuesFoundError,
  PlatformNotCompatible,
  AbortScene,
  SceneStopped,
  ConflictError,
  ForbiddenError,
  TooManyRequests,
  ExternalIntegrationUnavailableError,
};
