/**
 * @description Start connection with calDAV server.
 * @param {Object} user - Gladys user to connect.
 * @returns {Promise} Resolving with client connected.
 * @example
 * connect(user)
 */
async function connect(user) {
    const CALDAV_URL = await this.gladys.variable.getValue(`CALDAV_URL_USER_${user.id}`, this.serviceId);
    const CALDAV_USERNAME = await this.gladys.variable.getValue(`CALDAV_USERNAME${user.id}`, this.serviceId);
    const CALDAV_PASSWORD = await this.gladys.variable.getValue(`CALDAV_PASSWORD${user.id}`, this.serviceId);

    const xhr = new this.dav.transport.Basic(
        new this.dav.Credentials({
            username: CALDAV_USERNAME,
            password: CALDAV_PASSWORD
        })
    );

    const client = new this.dav.Client(xhr);
    
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const lastYearString = lastYear.toISOString()
        .split('.')[0]
        .concat('Z')
        .replace(/[-:]/g, '');

    return client.createAccount({
        server: CALDAV_URL,
        accountType: 'caldav',
        loadCollections: true,
        loadObjects: true,
        filters: [{
            type: 'comp-filter',
            attrs: { name: 'VCALENDAR' },
            children: [{
                type: 'comp-filter',
                attrs: { name: 'VEVENT' },
                children: [{
                    type: 'time-range',
                    attrs: { start: lastYearString },
                }],
            }]
        }]
    });
}

module.exports = {
    connect
};