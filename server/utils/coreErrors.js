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

// Why the voice of Gladys gave no clip, when the user can do something about it
const VOICE_UNAVAILABLE_REASONS = {
  // Gladys Plus is the voice, with no subscription
  SUBSCRIPTION_REQUIRED: 'subscription-required',
  // Gladys Plus is the voice, and its quota is reached
  QUOTA_REACHED: 'quota-reached',
};

class VoiceUnavailableError extends Error {
  constructor(message, reason = null) {
    super();
    this.message = message;
    this.reason = reason;
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
  VoiceUnavailableError,
  VOICE_UNAVAILABLE_REASONS,
};
