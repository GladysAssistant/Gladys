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
  IR_CODE: 'ir_code_',
  PERIPHERAL: 'peripheral',
  MANUFACTURER: 'manufacturer',
  REMOTE_TYPE: 'remote_type',
};

module.exports = {
  ACTIONS,
  PARAMS,
};
