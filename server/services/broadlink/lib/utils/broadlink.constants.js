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

// node-broadlink requests never time out: an unreachable device would keep a poll pending forever
const POLL_TIMEOUT = 10 * 1000;

module.exports = {
  ACTIONS,
  PARAMS,
  POLL_TIMEOUT,
};
