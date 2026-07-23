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
// Private bridge network of a multi-container integration (icc stays
// enabled inside: the main container must reach its sub-containers, e.g.
// Frigate -> Mosquitto). DNS alias of each sub-container = its `name`.
const PRIVATE_NETWORK_PREFIX = 'gladys-int-';
// Docker label carrying the sub-container `name` (the main container has
// only the reconciliation label).
const SUB_CONTAINER_LABEL = 'io.gladysassistant.container';
// Bounds of the `containers` manifest field (same rules as the indexer).
const MAX_SUB_CONTAINERS = 5;
const MAX_SUB_CONTAINER_VOLUMES = 5;
const MAX_SUB_CONTAINER_PORTS = 3;
const SUB_CONTAINER_NAME_REGEX = /^[a-z0-9-]{2,20}$/;
const SUB_CONTAINER_MEMORY_MIN_MB = 32;
const SUB_CONTAINER_MEMORY_MAX_MB = 4096;
const SUB_CONTAINER_MEMORY_DEFAULT_MB = 256;
const SUB_CONTAINER_CPU_MIN = 0.1;
const SUB_CONTAINER_CPU_MAX = 2;
const SUB_CONTAINER_CPU_DEFAULT = 0.5;
const SUB_CONTAINER_SHM_MIN_MB = 64;
const SUB_CONTAINER_SHM_MAX_MB = 512;
const SUB_CONTAINER_SHM_DEFAULT_MB = 64;
const SUB_CONTAINER_START_MODES = ['auto', 'manual'];
// Named hardware access classes (curated list, never a free /dev path).
// `path`: the class is a fixed path relative to /dev; `prefix`: every /dev
// entry starting with the prefix belongs to the class (e.g. /dev/video0...).
const HARDWARE_CLASSES = {
  'coral-usb': { path: 'bus/usb' },
  'coral-pcie': { prefix: 'apex_' },
  gpu: { path: 'dri' },
  video: { prefix: 'video' },
};
// Per-integration variables (scoped by service_id) holding the
// sub-container runtime state that must survive container recreations.
const SUB_CONTAINER_PORTS_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINER_PORTS';
const SUB_CONTAINER_DESIRED_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINERS_DESIRED';
const SUB_CONTAINER_ENV_VARIABLE = 'EXTERNAL_INTEGRATION_CONTAINERS_ENV';
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
// Communication integrations: user <-> contact link. The link itself is a
// variable scoped (service_id, user_id) — no migration needed; the short
// link codes live in the in-memory cache with a 15 minutes TTL.
const CONTACT_VARIABLE = 'EXTERNAL_INTEGRATION_CONTACT';
const LINK_CODE_CACHE_PREFIX = 'external-integration-link-code';
const LINK_CODE_TTL_MS = 15 * 60 * 1000;
const LINK_CODE_LENGTH = 8;
const MAX_MESSAGE_TEXT_LENGTH = 4096;
// Mediated network discovery (B.16): the core captures and emits from
// its network=host position, the integration interprets and forges (it
// knows the protocol, the core never parses nor builds a payload).
// Curated capture types only — never arbitrary capture.
const NETWORK_DISCOVERY_TYPES = ['udp-broadcast', 'udp-active-broadcast', 'mdns', 'ssdp'];
const MAX_NETWORK_DISCOVERY_ENTRIES = 5;
const MAX_UDP_BROADCAST_PORTS = 5;
const NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS = 1;
const NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS = 30;
const NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS = 10;
// Active scan (query/response protocols, the TP-Link Kasa case: the
// integration forges the request, the core broadcasts it and relays the
// unicast replies). Emission guardrails — the core sends a packet forged
// by a third party, the primitive must stay uninteresting to hijack:
// broadcast only (never a chosen unicast target), declared ports only,
// small payload, one scan per 10 seconds per integration.
const MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES = 512;
const ACTIVE_BROADCAST_MIN_INTERVAL_MS = 10 * 1000;
// Camera images: pushed through POST /camera/image (core's 150 KB bound),
// never through POST /state (dedicated saveStringState path, no state
// history). Continuous video streaming is out of the v1 scope.
const MAX_CAMERA_IMAGES_PER_MINUTE = 12;
// mirror of the core bound (camera.setImage MAX_SIZE_IMAGE)
const MAX_CAMERA_IMAGE_SIZE = 150 * 1024;
// on-demand fresh image (dashboard live view): an ffmpeg capture can be
// slow, this is the second exception to the 5s ack rule
const CAMERA_GET_IMAGE_TIMEOUT_MS = 15 * 1000;
// Reserved GLADYS_* params namespace in discovered devices: only the
// semantics defined by the spec are accepted. GLADYS_TRANSPORT is the
// effective transport of the device (cloud/local badge in the UI) —
// purely declarative, zero routing semantics in the core.
const RESERVED_PARAM_PREFIX = 'GLADYS_';
const TRANSPORT_PARAM = 'GLADYS_TRANSPORT';
const DEVICE_TRANSPORTS = ['local', 'cloud', 'unreachable'];
const MAX_TRANSPORTS_PER_REQUEST = 100;
// Degraded transport state, orthogonal to the transport enum ("which
// channel is used right now" and "is it the nominal state" are two
// different informations — e.g. local detected but sessions refused,
// falling back to cloud): GLADYS_TRANSPORT_DEGRADED = "true" (absent
// otherwise) + GLADYS_TRANSPORT_MESSAGE = the reason, a multi-language
// object serialized as JSON (en required, 200 chars max per language).
const TRANSPORT_DEGRADED_PARAM = 'GLADYS_TRANSPORT_DEGRADED';
const TRANSPORT_MESSAGE_PARAM = 'GLADYS_TRANSPORT_MESSAGE';
const MAX_TRANSPORT_MESSAGE_LENGTH = 200;
// Manifest transports field + the standard "prefer local" user preference,
// stored as a reserved config key (readable by the integration, never
// writable by it).
const MANIFEST_TRANSPORTS = ['local', 'cloud'];
const PREFER_LOCAL_CONFIG_KEY = 'GLADYS_PREFER_LOCAL';

module.exports = {
  EXTERNAL_INTEGRATION_LABEL,
  MANIFEST_IMAGE_LABEL,
  MANIFEST_FILE_NAME,
  PRIVATE_NETWORK_PREFIX,
  SUB_CONTAINER_LABEL,
  MAX_SUB_CONTAINERS,
  MAX_SUB_CONTAINER_VOLUMES,
  MAX_SUB_CONTAINER_PORTS,
  SUB_CONTAINER_NAME_REGEX,
  SUB_CONTAINER_MEMORY_MIN_MB,
  SUB_CONTAINER_MEMORY_MAX_MB,
  SUB_CONTAINER_MEMORY_DEFAULT_MB,
  SUB_CONTAINER_CPU_MIN,
  SUB_CONTAINER_CPU_MAX,
  SUB_CONTAINER_CPU_DEFAULT,
  SUB_CONTAINER_SHM_MIN_MB,
  SUB_CONTAINER_SHM_MAX_MB,
  SUB_CONTAINER_SHM_DEFAULT_MB,
  SUB_CONTAINER_START_MODES,
  HARDWARE_CLASSES,
  SUB_CONTAINER_PORTS_VARIABLE,
  SUB_CONTAINER_DESIRED_VARIABLE,
  SUB_CONTAINER_ENV_VARIABLE,
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
  CONTACT_VARIABLE,
  LINK_CODE_CACHE_PREFIX,
  LINK_CODE_TTL_MS,
  LINK_CODE_LENGTH,
  MAX_MESSAGE_TEXT_LENGTH,
  NETWORK_DISCOVERY_TYPES,
  MAX_NETWORK_DISCOVERY_ENTRIES,
  MAX_UDP_BROADCAST_PORTS,
  MAX_ACTIVE_BROADCAST_PAYLOAD_BYTES,
  ACTIVE_BROADCAST_MIN_INTERVAL_MS,
  NETWORK_DISCOVERY_MIN_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_MAX_TIMEOUT_SECONDS,
  NETWORK_DISCOVERY_DEFAULT_TIMEOUT_SECONDS,
  MAX_CAMERA_IMAGES_PER_MINUTE,
  MAX_CAMERA_IMAGE_SIZE,
  CAMERA_GET_IMAGE_TIMEOUT_MS,
  RESERVED_PARAM_PREFIX,
  TRANSPORT_PARAM,
  DEVICE_TRANSPORTS,
  MAX_TRANSPORTS_PER_REQUEST,
  TRANSPORT_DEGRADED_PARAM,
  TRANSPORT_MESSAGE_PARAM,
  MAX_TRANSPORT_MESSAGE_LENGTH,
  MANIFEST_TRANSPORTS,
  PREFER_LOCAL_CONFIG_KEY,
};
