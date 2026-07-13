const DEFAULT_MDNS_HOSTNAME = 'gladysassistant';
const MDNS_SERVICE_NAME = 'Gladys Assistant';
const HTTP_SERVICE_TYPE = '_http._tcp.local';
const MDNS_TTL = 120;
const MDNS_HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

module.exports = {
  DEFAULT_MDNS_HOSTNAME,
  MDNS_SERVICE_NAME,
  HTTP_SERVICE_TYPE,
  MDNS_TTL,
  MDNS_HOSTNAME_REGEX,
};
