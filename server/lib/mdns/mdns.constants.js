const { MDNS } = require('../../utils/constants');

// the hostname contract is shared with the front and the variable validation
const DEFAULT_MDNS_HOSTNAME = MDNS.DEFAULT_HOSTNAME;
const MDNS_SERVICE_NAME = 'Gladys Assistant';
const HTTP_SERVICE_TYPE = '_http._tcp.local';
// meta-query used by discovery tools to enumerate the service types of a network (RFC 6763)
const DNS_SD_META_QUERY = '_services._dns-sd._udp.local';
const GLADYS_MDNS_PRODUCT = 'gladys';
const MDNS_TTL = 120;

module.exports = {
  DEFAULT_MDNS_HOSTNAME,
  MDNS_SERVICE_NAME,
  HTTP_SERVICE_TYPE,
  DNS_SD_META_QUERY,
  GLADYS_MDNS_PRODUCT,
  MDNS_TTL,
};
