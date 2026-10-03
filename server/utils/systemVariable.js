/**
 * @description Check if a system variable value means enabled.
 * @param {any} value - Variable value.
 * @returns {boolean} True when enabled.
 * @example
 * isSystemVariableEnabled('1');
 */
function isSystemVariableEnabled(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

module.exports = {
  isSystemVariableEnabled,
};
