// Docker label used to find back integration containers (reconciliation
// at boot and after a backup restore).
const EXTERNAL_INTEGRATION_LABEL = 'io.gladysassistant.external-integration';
// Docker image label containing a copy of the manifest, used for
// the "dev" install mode by image name (without a GitHub repo).
const MANIFEST_IMAGE_LABEL = 'io.gladysassistant.manifest';
// Name of the manifest file at the root of the integration GitHub repo.
const MANIFEST_FILE_NAME = 'gladys-assistant-integration.json';
// Dedicated bridge network. icc is disabled so integrations are isolated
// from each other; container -> gateway (Gladys) and container -> internet
// still work.
const INTEGRATIONS_NETWORK_NAME = 'gladys-integrations';
// Subnet pinned by IPAM so the gateway (= the host, where the Gladys API
// listens) is deterministic on almost all installs.
const INTEGRATIONS_NETWORK_SUBNET = '172.30.0.0/24';
const INTEGRATIONS_NETWORK_GATEWAY = '172.30.0.1';
// Selector prefix, avoiding any collision with a future native service
// (service.load looks up services by name).
const SELECTOR_PREFIX = 'ext-';
const DEV_SELECTOR_PREFIX = 'ext-dev-';
// Highest manifest_version this Gladys knows how to handle.
const SUPPORTED_MANIFEST_VERSION = 1;
// State machine timings (see RFC):
// a started container is not a working integration: without a first
// successful WS auth or HTTP heartbeat within this delay -> DEGRADED.
const STARTUP_TIMEOUT_MS = 60 * 1000;
// checkHealth runs every 30 seconds.
const CHECK_HEALTH_INTERVAL_MS = 30 * 1000;
// A RUNNING status older than this without any heartbeat -> DEGRADED.
const HEARTBEAT_TIMEOUT_MS = 60 * 1000;
// failure_count is reset after this duration of stable RUNNING.
const STABLE_RUNNING_RESET_MS = 60 * 1000;
// After this number of supervisor restarts without stable recovery -> ERROR.
const MAX_FAILURE_COUNT = 5;
// Restart backoff: min(10s * 2^n, 15min).
const RESTART_BACKOFF_BASE_MS = 10 * 1000;
const RESTART_BACKOFF_MAX_MS = 15 * 60 * 1000;
// WebSocket protocol ping interval; 2 missed pongs -> DEGRADED.
const WEBSOCKET_PING_INTERVAL_MS = 20 * 1000;
const MAX_MISSED_PINGS = 2;
// Commands sent to the integration must be acked within this delay
// (manifest actions override it with their declared timeout_seconds).
const COMMAND_TIMEOUT_MS = 5 * 1000;
// Manifest actions: on-demand operations rendered as buttons in the
// Configuration screen. Their ack delay is per-action (they can be long:
// protocol detection, re-pairing...), bounded 5-120s.
const MAX_ACTIONS = 10;
const ACTION_MIN_TIMEOUT_SECONDS = 5;
const ACTION_MAX_TIMEOUT_SECONDS = 120;
const ACTION_DEFAULT_TIMEOUT_SECONDS = 30;
// Host API limits.
const MAX_DISCOVERED_DEVICES = 200;
const MAX_STATES_PER_REQUEST = 100;
const MAX_STATES_PER_MINUTE = 300;
// Mediated network discovery (B.16): the core captures from its
// network=host position, the integration interprets. Curated capture
// types only — never arbitrary capture.
const NETWORK_DISCOVERY_TYPES = ['udp-broadcast', 'mdns', 'ssdp'];
const MAX_NETWORK_DISCOVERY_ENTRIES = 5;
const MAX_UDP_BROADCAST_PORTS = 5;
const NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS = 1;
const NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS = 30;
const NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS = 10;

module.exports = {
  EXTERNAL_INTEGRATION_LABEL,
  MANIFEST_IMAGE_LABEL,
  MANIFEST_FILE_NAME,
  INTEGRATIONS_NETWORK_NAME,
  INTEGRATIONS_NETWORK_SUBNET,
  INTEGRATIONS_NETWORK_GATEWAY,
  SELECTOR_PREFIX,
  DEV_SELECTOR_PREFIX,
  SUPPORTED_MANIFEST_VERSION,
  STARTUP_TIMEOUT_MS,
  CHECK_HEALTH_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  STABLE_RUNNING_RESET_MS,
  MAX_FAILURE_COUNT,
  RESTART_BACKOFF_BASE_MS,
  RESTART_BACKOFF_MAX_MS,
  WEBSOCKET_PING_INTERVAL_MS,
  MAX_MISSED_PINGS,
  COMMAND_TIMEOUT_MS,
  MAX_ACTIONS,
  ACTION_MIN_TIMEOUT_SECONDS,
  ACTION_MAX_TIMEOUT_SECONDS,
  ACTION_DEFAULT_TIMEOUT_SECONDS,
  MAX_DISCOVERED_DEVICES,
  MAX_STATES_PER_REQUEST,
  MAX_STATES_PER_MINUTE,
  NETWORK_DISCOVERY_TYPES,
  MAX_NETWORK_DISCOVERY_ENTRIES,
  MAX_UDP_BROADCAST_PORTS,
  NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS,
};
