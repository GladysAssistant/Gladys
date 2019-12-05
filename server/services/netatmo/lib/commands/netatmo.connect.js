const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Connect.
 * @example
 * xiaomi.connect();
 */
async function connect() {
    const netatmo_Client_Id = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_ID, this.serviceId);
    const netatmo_Client_Secret = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_SECRET, this.serviceId);
    const netatmo_Username = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_USERNAME, this.serviceId);
    const netatmo_Password = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_PASSWORD, this.serviceId);
    const variablesFound = netatmo_Client_Id;
    if (!variablesFound) {
        this.configured = false;
        throw new ServiceNotConfiguredError('NETATMO is not configured.');
    }
    this.configured = true;
    const auth = {
        "client_id": netatmo_Client_Id,
        "client_secret": netatmo_Client_Secret,
        "username": netatmo_Username,
        "password": netatmo_Password,
    }
    this.api = new this.netatmo(auth)
}

module.exports = {
    connect,
};
a