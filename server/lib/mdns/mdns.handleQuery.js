const { HTTP_SERVICE_TYPE, DNS_SD_META_QUERY, MDNS_TTL } = require('./mdns.constants');

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
  const instanceFqdn = this.instanceFqdn.toLowerCase();
  const wanted = { meta: false, hostname: false, service: false, instance: false, txt: false };
  // the socket sees every mDNS query of the network, and most of them are not about
  // Gladys: the questions are classified before the records are built, so an unrelated
  // packet never reads the network interfaces
  (query.questions || []).forEach((/** @type {any} */ question) => {
    const name = (question.name || '').toLowerCase();
    const { type } = question;
    if (name === this.fqdn && (type === 'A' || type === 'ANY')) {
      wanted.hostname = true;
    } else if (name === HTTP_SERVICE_TYPE && (type === 'PTR' || type === 'ANY')) {
      wanted.service = true;
    } else if (name === instanceFqdn && (type === 'SRV' || type === 'ANY')) {
      wanted.instance = true;
      // DNS-SD clients asking ANY expect the TXT record alongside the SRV one
      if (type === 'ANY') {
        wanted.txt = true;
      }
    } else if (name === instanceFqdn && type === 'TXT') {
      wanted.txt = true;
    } else if (name === DNS_SD_META_QUERY && (type === 'PTR' || type === 'ANY')) {
      // enumeration of the service types of the network, used by discovery tools
      wanted.meta = true;
    }
  });
  if (!Object.values(wanted).some((asked) => asked)) {
    return null;
  }
  const records = this.getRecords(MDNS_TTL);
  if (records.length === 0) {
    return null;
  }
  const [ptrRecord, srvRecord, txtRecord, aRecord] = records;
  /** @type {Array<any>} */
  const answers = [];
  /** @type {Set<any>} */
  const additionalCandidates = new Set();
  if (wanted.meta) {
    answers.push({ name: DNS_SD_META_QUERY, type: 'PTR', ttl: MDNS_TTL, data: HTTP_SERVICE_TYPE });
  }
  if (wanted.hostname) {
    answers.push(aRecord);
  }
  if (wanted.service) {
    answers.push(ptrRecord);
    [srvRecord, txtRecord, aRecord].forEach((record) => additionalCandidates.add(record));
  }
  if (wanted.instance) {
    answers.push(srvRecord);
    additionalCandidates.add(aRecord);
  }
  if (wanted.txt) {
    answers.push(txtRecord);
  }
  // a record already sent as an answer must not be repeated in the additionals
  const additionals = [...additionalCandidates].filter((record) => !answers.includes(record));
  this.mdns.respond({ answers, additionals });
  return null;
}

module.exports = {
  handleQuery,
};
