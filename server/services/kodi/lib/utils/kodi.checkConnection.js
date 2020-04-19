/**
 * @private
 * @description This function return true if kodi connection is not null.
 * @param {Object} connection - The connection connection to check.
 * @example
 * kodi.checkConnection(connection);
 * @returns {boolean} True if kodi connection is not null.
 */
function checkConnection(connection) {
	if ( connection ){
		return true;
	}
	return false;
}

module.exports = {
  checkConnection,
};
