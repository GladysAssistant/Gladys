const { HTTP_SERVICE_TYPE, MDNS_TTL } = require('./mdns.constants');

/**
 * @description Answer incoming mDNS queries about the Gladys hostname or HTTP service.
 * @param {any} query - The decoded mDNS query packet.
 * @returns {null} Null.
 * @example
 * mdns.handleQuery(query);
 */
function handleQuery(query) {
  if (this.mdns === null) {
    return null;
  }
  const records = this.getRecords(MDNS_TTL);
  if (records.length === 0) {
    return null;
  }
  const [ptrRecord, srvRecord, txtRecord, aRecord] = records;
  const instanceFqdn = this.instanceFqdn.toLowerCase();
  /** @type {Array<any>} */
  const answers = [];
  /** @type {Array<any>} */
  const additionals = [];
  (query.questions || []).forEach((/** @type {any} */ question) => {
    const name = (question.name || '').toLowerCase();
    const { type } = question;
    if (name === this.fqdn && (type === 'A' || type === 'ANY')) {
      answers.push(aRecord);
    } else if (name === HTTP_SERVICE_TYPE && (type === 'PTR' || type === 'ANY')) {
      answers.push(ptrRecord);
      additionals.push(srvRecord, txtRecord, aRecord);
    } else if (name === instanceFqdn && (type === 'SRV' || type === 'ANY')) {
      answers.push(srvRecord);
      additionals.push(aRecord);
    } else if (name === instanceFqdn && type === 'TXT') {
      answers.push(txtRecord);
    }
  });
  if (answers.length > 0) {
    this.mdns.respond({ answers, additionals });
  }
  return null;
}

module.exports = {
  handleQuery,
};
