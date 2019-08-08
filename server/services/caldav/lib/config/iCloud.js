/**
 * @description Request iCloud.
 * @param {*} request - Module request.
 * @param {string} path - Request path.
 * @param {Object} auth - User account credentials.
 * @param {string} postData - Request body.
 * @returns {Promise} Resolving with request response.
 * @example
 * iCloudRequest(request, '/', {
 *         appleId: 'tony.stark@icloud.com',
 *         password: '12345'
 *     },
 *     '<propfind xmlns=\'DAV:\'>...</propfind>'
 * )
 */
function iCloudRequest(request, path, auth, postData) {
  return request({
    auth: {
      username: auth.appleId,
      password: auth.password,
    },
    uri: `https://caldav.icloud.com${path}`,
    method: 'PROPFIND',
    body: postData,
  });
}

/**
 * @description Auto configure iCloud account.
 * @param {string} userId - Gladys User ID.
 * @param {string} appleId - User apple ID.
 * @param {string} password - User password.
 * @example
 * iCloud('tony.stark@icloud.com', '1234567890')
 */
async function iCloud(userId, appleId, password) {
  const auth = {
    appleId,
    password,
  };

  let postData = `
    <propfind xmlns='DAV:'>
      <prop>
        <current-user-principal/>
      </prop>
    </propfind>
  `;

  let xml = await iCloudRequest(this.request, '/', auth, postData);
  let xmlDoc = new this.xmlDom.DOMParser().parseFromString(xml);
  const path = xmlDoc.getElementsByTagName('current-user-principal')[0].getElementsByTagName('href')[0].childNodes[0]
    .nodeValue;
  postData = `
    <propfind xmlns='DAV:' xmlns:cd='urn:ietf:params:xml:ns:caldav'>
      <prop>
        <cd:calendar-home-set/>
      </prop>
    </propfind>
  `;

  xml = await iCloudRequest(this.request, path, auth, postData);
  xmlDoc = new this.xmlDom.DOMParser().parseFromString(xml);
  const url = xmlDoc
    .getElementsByTagName('calendar-home-set')[0]
    .getElementsByTagName('href')[0]
    .childNodes[0].nodeValue.split(':443')[0];
  await this.gladys.variable.setValue('CALDAV_URL', url, this.serviceId, userId);
  return { url };
}

module.exports = {
  iCloudRequest,
  iCloud,
};
