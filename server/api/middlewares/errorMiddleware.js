const {
  HttpError,
  Error400,
  Error403,
  Error404,
  Error409,
  Error413,
  Error422,
  Error500,
  Error429,
} = require('../../utils/httpErrors');
const {
  PasswordNotMatchingError,
  NotFoundError,
  ServiceNotConfiguredError,
  BadParameters,
  ConflictError,
  ForbiddenError,
  TooManyRequests,
  ExternalIntegrationUnavailableError,
} = require('../../utils/coreErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const logger = require('../../utils/logger');

module.exports = function errorMiddleware(error, req, res, next) {
  let responseError;
  logger.debug(error);

  // If Joi validationError
  if (error && error.isJoi === true) {
    responseError = new Error422(error.details[0].message);
  } else if (error && error.name === 'SequelizeValidationError') {
    const errorsArray = [];
    error.errors.forEach((err) => {
      errorsArray.push({
        message: err.message,
        attribute: err.path,
        value: err.value,
        type: err.type,
        // where the rejected field comes from (ex: the feature of a device).
        // Optional: only present when the thrower knew the context.
        ...(error.gladysContext ? { context: error.gladysContext } : {}),
      });
    });
    responseError = new Error422(errorsArray);
  } else if (error && error.name === 'SequelizeUniqueConstraintError') {
    const errorToReturn = {
      message: error.errors[0].message,
      attribute: error.errors[0].path,
      value: error.errors[0].value,
      type: error.errors[0].type,
      ...(error.gladysContext ? { context: error.gladysContext } : {}),
    };
    responseError = new Error409(errorToReturn);
  } else if (error && error.type === 'entity.too.large') {
    // body-parser rejected the request before any controller ran. Without
    // this branch it came back as an opaque 500: the caller (typically an
    // external integration publishing a big batch) could not tell that the
    // problem was the size of its payload.
    logger.warn(`Payload too large on ${req.method} ${req.path}: ${error.length} bytes (limit ${error.limit})`);
    responseError = new Error413(`Payload too large: ${error.limit} bytes max on this route`);
  } else if (error instanceof BadParameters) {
    responseError = new Error400(error.message);
  } else if (error instanceof PasswordNotMatchingError) {
    responseError = new Error403(error.message);
  } else if (error instanceof ServiceNotConfiguredError) {
    responseError = new Error400(ERROR_MESSAGES.SERVICE_NOT_CONFIGURED);
  } else if (error instanceof NotFoundError && req.path === '/api/login') {
    responseError = new Error403();
  } else if (error instanceof NotFoundError) {
    responseError = new Error404(error.message);
  } else if (error instanceof HttpError) {
    responseError = error;
  } else if (error instanceof ConflictError) {
    responseError = new Error409(error.message);
  } else if (error instanceof ForbiddenError) {
    responseError = new Error403(error.message);
  } else if (error instanceof TooManyRequests) {
    responseError = new Error429({ time_before_next: error.timeBeforeNext });
  } else if (error instanceof ExternalIntegrationUnavailableError) {
    responseError = new Error400(error.message);
  } else {
    logger.warn(error);
    responseError = new Error500(error);
  }

  res.status(responseError.status).send(responseError);
};
