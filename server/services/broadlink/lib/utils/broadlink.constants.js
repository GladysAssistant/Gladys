const ACTIONS = {
  LEARN: {
    SUCCESS: 'success',
    ERROR: 'error',
    CANCEL_ERROR: 'cancel_error',
    CANCEL_SUCCESS: 'cancel_success',
    NO_PERIPHERAL: 'no_peripheral',
  },
  SEND: {
    SUCCESS: 'success',
    ERROR: 'error',
  },
};

const PARAMS = {
  CODE: 'code_',
  PERIPHERAL: 'peripheral',
};

module.exports = {
  ACTIONS,
  PARAMS,
};
